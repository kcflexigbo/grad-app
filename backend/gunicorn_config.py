bind = "unix:/var/www/grad-app/grad-app.sock"
workers = 4
accesslog = "/var/www/grad-app/grad-app/backend/logs/access.log"
errorlog = "/var/www/grad-app/grad-app/backend/logs/error.log"
loglevel = "info"
k ="uvicorn.workers.UvicornWorker"
capture_output = True