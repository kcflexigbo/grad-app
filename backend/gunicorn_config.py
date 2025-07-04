bind = "unix:/var/www/grad-app/grad-app.sock"
workers = 4
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"
k ="uvicorn.workers.UvicornWorker"
capture_output = True