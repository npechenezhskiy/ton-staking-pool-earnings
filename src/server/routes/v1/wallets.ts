import * as fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http';
import { PrismaClient, Deposit } from '@prisma/client'

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
        },
        404: {
            type: 'string'
        }
    }
}

interface IGetWalletParams {
    walletAddr: string
}

type GetWalletRequest = fastify.FastifyRequest<{ Params: IGetWalletParams }>

const getWalletHandler: fastify.RouteHandlerMethod = async (request: GetWalletRequest, reply: fastify.FastifyReply) => {
    const walletAddr: string = request.params.walletAddr

    await prisma.wallet.findUnique({
        where: { address: walletAddr},
        include: {
            deposits: true
        }
    })

    // if (wallet === null) {
    //     reply.code(404).send('Wallet not found!')
    //     return
    // }

    const balance = bigint(0)
    const totalEarnings = bigint(0)

    // for (const deposit of wallet.deposits) {
    //     balance = balance + deposit.amount
    //     totalEarnings
    // }

    reply.send({
        balance: balance,
        totalEarnings: totalEarnings
    })
}

const getWallet: fastify.RouteOptions<Server, IncomingMessage, ServerResponse> = {
    method: 'GET',
    url: '/:walletAddr',
    handler: getWalletHandler,
    schema: walletSchema,
}

const getDepositEarnings = async function (deposit: Deposit, perDayProfitPercentage: number) {   // eslint-disable-line @typescript-eslint/no-unused-vars
    const now: number = Date.now()
    const daysPassed: number = (now - deposit.dateCreated.getTime()) % 86400000
    // Co compound interest therefore just multiply
    return deposit.amount * bigint(perDayProfitPercentage) * bigint(daysPassed)
}

export default getWallet
