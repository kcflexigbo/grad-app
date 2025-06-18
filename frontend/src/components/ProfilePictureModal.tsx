import { useState, type ChangeEvent, type FormEvent } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import apiService from '../api/apiService';

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    isOwnProfile: boolean;
    onUploadSuccess: (newImageUrl: string) => void;
}

export const ProfilePictureModal = ({
    isOpen,
    onClose,
    imageUrl,
    isOwnProfile,
    onUploadSuccess,
}: ProfilePictureModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // NOTE: You will need to create this backend endpoint!
            const response = await apiService.post('/users/me/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUploadSuccess(response.data.profile_picture_url);
            handleClose();
        } catch (err) {
            setError('Upload failed. Please try again.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    // Reset state when closing the modal
    const handleClose = () => {
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        setIsUploading(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={handleClose} // Close modal on backdrop click
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg relative flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-serif">Profile Picture</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content: Image Preview */}
                <div className="p-6 flex-grow flex items-center justify-center">
                    <img
                        src={previewUrl || imageUrl}
                        alt="Profile"
                        className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                </div>

                {/* Conditional Footer for Uploading */}
                {isOwnProfile && (
                    <div className="px-6 py-4 bg-gray-50 border-t space-y-4">
                        <div>
                            <label htmlFor="pfp-upload" className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                <UploadCloud size={18} />
                                <span>Choose a new photo...</span>
                            </label>
                            <input
                                id="pfp-upload"
                                type="file"
                                className="sr-only"
                                accept="image/png, image/jpeg"
                                onChange={handleFileChange}
                            />
                        </div>

                        {file && (
                            <div className="flex justify-end items-center gap-4">
                                {error && <p className="text-sm text-red-600 mr-auto">{error}</p>}
                                <span className="text-sm text-gray-600 truncate">{file.name}</span>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        'Confirm Upload'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};