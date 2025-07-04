import os.path
from datetime import datetime

logs_file = "logs/only_errors.log"

if not os.path.exists(logs_file):
    os.makedirs(os.path.dirname(logs_file), exist_ok=True)
    with open(logs_file, "w+") as f:
        pass

with open(logs_file, "a+") as f:
    f.write(f"\n\n\n\n----{datetime.now()} ----\n")