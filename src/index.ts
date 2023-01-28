
import * as dotenv from 'dotenv'
import * as fastify from 'fastify'

dotenv.config();
const server = fastify()
const portEnv: string | undefined = process.env.TSPE_PORT
const port: number = (typeof portEnv === 'undefined') ? 8888 : +portEnv;

server.get('/ping', async (request, reply) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  return 'pong\n'
})

server.listen({ port: port }, (err: Error | null, address: string) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
