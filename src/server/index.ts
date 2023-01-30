import * as dotenv from 'dotenv'
import * as fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from "http";
import getWallet from '../routes/v1/wallets'


dotenv.config();

const server: fastify.FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify.default();

server.route(getWallet)

const portEnv: string | undefined = process.env.TSPE_PORT
const port: number = (typeof portEnv === 'undefined') ? 8888 : +portEnv

server.listen({ port: port }, (err: Error | null, address: string) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
