import * as fastify from 'fastify'

export const walletSchema: fastify.FastifySchema = {
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

export interface IGetWalletParams {
    walletAddr: string
}

interface ElectionEntity {
    address: string,
    stake: string,
    weight: string
}

export interface Election {
    bonuses: string,
    frozen: ElectionEntity[],
    stakeHeId: number,
    totalStake: string,
    unfreezeAt: number
}

export type GetWalletRequest = fastify.FastifyRequest<{ Params: IGetWalletParams }>

export interface ILatestElections {
    elections: number[]
}
