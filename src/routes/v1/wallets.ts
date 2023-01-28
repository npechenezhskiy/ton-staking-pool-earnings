import * as fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Address } from 'ton' // eslint-disable-line @typescript-eslint/no-unused-vars


const walletSchema: fastify.FastifySchema = {
    params: {
        type: 'object',
        properties: {
            wallet: {
                type: 'string'
            }
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                balance: {
                    type: 'number'
                },
                totalEarnings: {
                    type: 'number'
                }
            }
        }
    }
}

interface IGetWalletParams {
    wallet: number
}

type GetWalletRequest = fastify.FastifyRequest<{ Params: IGetWalletParams }>

const getWalletHandler: fastify.RouteHandlerMethod = async (request: GetWalletRequest, reply: fastify.FastifyReply) => {
    const wallet: number = request.params.wallet  // eslint-disable-line @typescript-eslint/no-unused-vars
    reply.send({
        balance: 'foo',
        totalEarnings: 'bar'
    })
}

const getWallet: fastify.RouteOptions<Server, IncomingMessage, ServerResponse> = {
    method: 'GET',
    url: '/:wallet',
    handler: getWalletHandler,
    schema: walletSchema,
}

export default getWallet
