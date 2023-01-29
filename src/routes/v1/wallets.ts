import * as fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Address, TonClient4 } from 'ton' // eslint-disable-line @typescript-eslint/no-unused-vars
import { PrismaClient } from '@prisma/client'

const prisma: PrismaClient = new PrismaClient();

const walletSchema: fastify.FastifySchema = {
    params: {
        type: 'object',
        properties: {
            walletAddr: {
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
    walletAddr: string
}

type GetWalletRequest = fastify.FastifyRequest<{ Params: IGetWalletParams }>

const getWalletHandler: fastify.RouteHandlerMethod = async (request: GetWalletRequest, reply: fastify.FastifyReply) => {
    const walletAddr: string = request.params.walletAddr  // eslint-disable-line @typescript-eslint/no-unused-vars
    reply.send({
        balance: 123,
        totalEarnings: 123
    })
}

const getWallet: fastify.RouteOptions<Server, IncomingMessage, ServerResponse> = {
    method: 'GET',
    url: '/:walletAddr',
    handler: getWalletHandler,
    schema: walletSchema,
}

export default getWallet
