import os.path
from datetime import datetime

logs_files = ["logs/only_errors.log", "logs/honeypot.log"]

for logs_file in logs_files:
    if not os.path.exists(logs_file):
        os.makedirs(os.path.dirname(logs_file), exist_ok=True)
        with open(logs_file, "w+") as f:
            pass