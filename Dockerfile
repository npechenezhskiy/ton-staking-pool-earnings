FROM node:slim

ARG TSPE_PORT

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm install prisma && npx prisma generate
RUN npm run build

EXPOSE ${TSPE_PORT}
CMD [ "bash", "docker-entrypoint.sh" ]