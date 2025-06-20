FROM node:20-alpine AS builder
LABEL authors="kcfle"

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY .env.production ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]