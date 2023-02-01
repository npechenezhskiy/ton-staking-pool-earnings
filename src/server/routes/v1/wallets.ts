import * as fastify from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http';
import { PrismaClient, Deposit } from '@prisma/client'
import { APIClient } from '../../api';
import { GetWalletRequest, walletSchema, ILatestElections, Election, ElectionEntity } from '../../schema'

const baseSstakePoolWalletAddr: string | undefined = process.env.TSPE_BASE_STAKE_POOL_WALLET_ADDRESS
if (typeof baseSstakePoolWalletAddr === 'undefined') {
	throw Error('TSPE_BASE_STAKE_POOL_WALLET_ADDRESS is not set!')
}

const prisma: PrismaClient = new PrismaClient();
const apiClient: APIClient = new APIClient()

const getWalletHandler: fastify.RouteHandlerMethod = async (request: GetWalletRequest, reply: fastify.FastifyReply) => {
    const walletAddr: string = request.params.walletAddr

    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddr},
        include: {
            deposits: true
        }
    })

    if (wallet === null) {
        reply.code(404).send('Wallet not found!')
        return
    }

    let balance = Number(0)
    let totalEarnings = Number(0)

    let perDayProfitPercentage: Number = await  getPerDayProfitPercentage(apiClient);

    for (const deposit of wallet.deposits) {
        balance = balance + Number(deposit.amount.toString())
        totalEarnings = totalEarnings + await getDepositEarnings(deposit, perDayProfitPercentage)
    }

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

const getDepositEarnings = async function (deposit: Deposit, perDayProfitPercentage: Number) {   // eslint-disable-line @typescript-eslint/no-unused-vars
    const now: number = Date.now()
    const daysPassed: number = (now - deposit.dateCreated.getTime()) % 86400000
    // Co compound interest therefore just multiply
    return Number(deposit.amount.toString()) * Number(perDayProfitPercentage) * Number(daysPassed)
}


const getPerDayProfitPercentage = async function (apiClient: APIClient) {
    const latestEletions: ILatestElections = await (await apiClient.getLastestElections()).json()
    const latestElectionId: number = latestEletions.elections.slice(-1)[0]
    const election: Election = (await (await apiClient.getElectionsById(latestElectionId)).json()).election
    const totalBonuses = Number(election.bonuses)
    let totalWeight = Number(0)
    let totalWhalesWeight = Number(0)
    let totalWhalesStake = Number(0)

    for (const electionEntity of election.frozen) {
        totalWeight += Number(electionEntity.weight)
        if (electionEntity.address === baseSstakePoolWalletAddr) {
            totalWhalesWeight += Number(electionEntity.weight)
            totalWhalesStake += Number(electionEntity.stake)
        }
    }

    const whalesProfitPercentage = Number(totalWhalesWeight / totalWeight)
    const whalesProfitAmount = Number(totalBonuses * whalesProfitPercentage)
    const APY = Number(whalesProfitAmount / totalBonuses)
    return APY
}

export default getWallet
