#!usr/bin/bash

npx prisma migrate dev
node dist/server/index.js