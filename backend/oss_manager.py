import os
import boto3
from fastapi import UploadFile
from dotenv import load_dotenv
import uuid
from botocore.client import Config
from urllib.parse import urlparse

load_dotenv(dotenv_path="../.env")

# Load credentials from environment variables
OSS_ACCESS_KEY_ID = os.getenv("OSS_ACCESS_KEY_ID")
OSS_ACCESS_KEY_SECRET = os.getenv("OSS_ACCESS_KEY_SECRET")
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT")
OSS_BUCKET_NAME = os.getenv("OSS_BUCKET_NAME")

if not all([OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_ENDPOINT, OSS_BUCKET_NAME]):
    raise ValueError("One or more OSS environment variables are not set.")

s3_config = Config(
    s3={'addressing_style': 'virtual'}, # Use virtual-hosted style
    signature_version='s3'            # Use the latest signature version
)

# Initialize the S3 client for Alibaba Cloud OSS
s3_client = boto3.client(
    's3',
    aws_access_key_id=OSS_ACCESS_KEY_ID,
    aws_secret_access_key=OSS_ACCESS_KEY_SECRET,
    endpoint_url=f'https://{OSS_ENDPOINT}',
    config=s3_config
)


def upload_file_to_oss(file: UploadFile, object_name: str) -> str:
    """
    Uploads a file to an Alibaba Cloud OSS bucket and returns the public URL.

    :param file: The file object from FastAPI's UploadFile.
    :param object_name: The desired path and filename in the bucket.
    :return: The public URL of the uploaded file.
    """
    try:
        s3_client.upload_fileobj(
            file.file,
            OSS_BUCKET_NAME,
            object_name,
            ExtraArgs={
                'ACL': 'public-read',
                'ContentType': file.content_type
            }
        )
    except Exception as e:
        print(f"Error uploading to OSS: {e}")
        raise e

    public_url = f"https://{OSS_BUCKET_NAME}.{OSS_ENDPOINT}/{object_name}"
    return public_url

def upload_local_file_to_oss(local_file_path: str, object_name: str, content_type: str) -> str:
    """
    Uploads a file from a local path on the server to OSS.
    """
    try:
        s3_client.upload_file(
            local_file_path,
            OSS_BUCKET_NAME,
            object_name,
            ExtraArgs={
                'ACL': 'public-read',
                'ContentType': content_type
            }
        )
    except Exception as e:
        print(f"Error uploading local file to OSS: {e}")
        raise e

    public_url = f"https://{OSS_BUCKET_NAME}.{OSS_ENDPOINT}/{object_name}"
    return public_url


def delete_file_from_oss(file_url: str) -> bool:
    """
    Deletes a file from the Alibaba Cloud OSS bucket based on its full URL.

    :param file_url: The full public URL of the file to delete.
    :return: True if deletion was successful, otherwise raises an exception.
    """
    # First, a sanity check. Don't try to delete a placeholder or an empty URL.
    if not file_url or "processing" in file_url:
        print(f"Skipping deletion for placeholder or empty URL: {file_url}")
        return True  # Return True to not block the operation

    try:
        parsed_url = urlparse(file_url)
        object_name = parsed_url.path.lstrip('/')

        if not object_name:
            raise ValueError("Could not extract object name from URL")

        print(f"Attempting to delete object: {object_name} from bucket: {OSS_BUCKET_NAME}")

        s3_client.delete_object(
            Bucket=OSS_BUCKET_NAME,
            Key=object_name
        )

        print(f"Successfully deleted {object_name}.")
        return True

    except Exception as e:
        print(f"Error deleting file {file_url} from OSS: {e}")
        return False