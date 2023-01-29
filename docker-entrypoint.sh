#!usr/bin/bash

npx prisma migrate dev
node dist/index.js