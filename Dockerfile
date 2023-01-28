FROM node:slim

ARG TSPE_PORT

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE ${TSPE_PORT}
CMD [ "node", "dist/index.js" ]