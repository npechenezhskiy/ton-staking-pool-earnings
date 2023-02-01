import { createClient, RedisClientType } from 'redis'

const redisHostPwd: string | undefined = process.env.REDIS_HOST_PASSWORD
if (typeof redisHostPwd === 'undefined') {
    throw Error('REDIS_HOST_PASSWORD is not set!')
}

const LAST_SYNCED_BLOCK = 'LAST_SYNCED_BLOCK'
const WALLET_FIRST_BLOCK = 'WALLET_FIRST_BLOCK'
const LAST_BLOCK = 'LAST_BLOCK'
const LAST_SYNCED_HASH = 'LAST_SYNCED_HASH'
const LAST_SYNCED_TRANSACTION_SEQNO = 'LAST_SYNCED_TRANSACTION_SEQNO'


export class CacheClient {
    redis: RedisClientType

    constructor() {
        this.redis = createClient({
            password: redisHostPwd,
            socket: {
                host: "redis"
            }
        })
    }

    async connect() {
        await this.redis.connect()
    }

    async getLastSyncedBlock() {
        const syncedUpTo: string | null = await this.redis.get(LAST_SYNCED_BLOCK)
        return (syncedUpTo === null) ? null : parseInt(syncedUpTo)
    }

    async setLastSyncedBlock(value: number) {
        await this.redis.set(LAST_SYNCED_BLOCK, value.toString())
    }

    async getWalletFirstBlock() {
        const walletFirstBlock: string | null = await this.redis.get(WALLET_FIRST_BLOCK)
        return (walletFirstBlock === null) ? null : parseInt(walletFirstBlock)
    }

    async setWalletFirstBlock(value: number) {
        await this.redis.set(WALLET_FIRST_BLOCK, value.toString())
    }

    async getCurrentBlock() {
        const currentBlock: string | null = await this.redis.get(LAST_BLOCK)
        return (currentBlock === null) ? null : parseInt(currentBlock)
    }

    async setCurrentBlock(value: number) {
        await this.redis.set(LAST_BLOCK, value.toString())
    }

    async getSyncedWalletLastHash() {
        return await this.redis.get(LAST_SYNCED_HASH)
    }

    async setSyncedWalletLastHash(value: string) {
        await this.redis.set(LAST_SYNCED_HASH, value)
    }

    async getLastSyncedTransactionSeqNo() {
        const seqno: string | null = await this.redis.get(LAST_SYNCED_TRANSACTION_SEQNO)
        return (seqno === null) ? null : parseInt(seqno)
    }

    async setLastSyncedTransactionSeqNo(value: number) {
        await this.redis.set(LAST_SYNCED_TRANSACTION_SEQNO, value.toString())
    }

}