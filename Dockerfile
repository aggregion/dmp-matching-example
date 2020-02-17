FROM node:12-alpine

COPY src /app
COPY package.json /app
COPY package-lock.json /app

WORKDIR /app
RUN npm ci --prod

CMD node /app/server.js
