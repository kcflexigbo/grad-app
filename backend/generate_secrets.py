import secrets
secret_token = secrets.token_hex(32)
with open('secrets.txt', 'w') as f:
    print(secret_token, file=f)