import { WebSocket, MessageEvent } from 'ws'
import { BlockLite, BlockFullWS, TransactionsResponse } from './schema'
import { CacheClient } from './cache'
import { APIClient } from './api'
import { RawTransaction } from "ton"
import { PrismaClient } from '@prisma/client'


// Environment
const apiBaseUrl: string | undefined = process.env.TSPE_API_BASE_URL
if (typeof apiBaseUrl === 'undefined') {
  throw Error('TSPE_API_BASE_URL is not set!')
}

const stakingPoolAddress: string | undefined = process.env.TSPE_STAKE_POOL_WALLET_ADDRESS
if (typeof stakingPoolAddress === 'undefined') {
  throw Error('TSPE_STAKE_POOL_WALLET_ADDRESS is not set!')
}

const stakeAccceptedReStr: string | undefined = process.env.TSPE_STAKE_ACCEPTED_REGEXP
if (typeof stakeAccceptedReStr === 'undefined') {
  throw Error('TSPE_STAKE_ACCEPTED_REGEXP is not set!')
}

const stakeWithdrawCompletedReStr: string | undefined = process.env.TSPE_WITHDRAW_COMPLETED_REGEXP
if (typeof stakeWithdrawCompletedReStr === 'undefined') {
  throw Error('TSPE_WITHDRAW_COMPLETED_REGEXP is not set!')
}

const stakeAccceptedRe = new RegExp(stakeAccceptedReStr)
const stakeWithdrawCompletedRe = new RegExp(stakeWithdrawCompletedReStr)

// WS
const wsBaseUrl: string = apiBaseUrl.replace('http://', 'ws://')
const wsWatchBlockChangeUrl: string = wsBaseUrl + '/block/watch/changed'
const ws: WebSocket = new WebSocket(wsWatchBlockChangeUrl)

// DB
const prisma: PrismaClient = new PrismaClient();


ws.onerror = async () => {
  // API takes time to start the socket endpoint, just restart
  process.exit(1)
}

ws.onopen = async () => {
  const cacheClient: CacheClient = new CacheClient()
  await cacheClient.connect()

  const apiClient: APIClient = new APIClient()

  let walletFirstBlock: number = await cacheClient.getWalletFirstBlock() || -1
  if (walletFirstBlock === -1) {
    const fethedWalletFirstBlock: number = await apiClient.getStakingPoolFirstBlock() || -1
    if (fethedWalletFirstBlock === -1) {
      console.log('Failed to fetch first wallet block')
      process.exit(1)
    }
    walletFirstBlock = fethedWalletFirstBlock
    await cacheClient.setWalletFirstBlock(fethedWalletFirstBlock)
    console.log("Fetched first wallet block: " + fethedWalletFirstBlock)
  } else {
    console.log("fetched first wallet block from cache: " + walletFirstBlock)
  }

  let syncRunning = false

  ws.onmessage = async (message: MessageEvent) => {
    const blockData: BlockFullWS = JSON.parse(message.data.toString())
    const blockSeqNo = blockData.seqno
    await cacheClient.setCurrentBlock(blockSeqNo)
    const lastSyncedBlock = await cacheClient.getLastSyncedBlock() || -1
    // console.log(blockSeqNo, lastSyncedBlock)
    if (blockSeqNo - lastSyncedBlock == 1) {
      // Sync is up to date
      await syncBlock(apiClient, cacheClient, blockSeqNo)
      await cacheClient.setLastSyncedBlock(blockSeqNo)
      syncRunning = false
    } else {
      // Sync to catch up
      if (syncRunning) {
        // Sync is running already, nothing to do
        return
      }
      performSync(apiClient, cacheClient, walletFirstBlock)
      syncRunning = true
    }
  }
}


const performSync = async function (apiClient: APIClient, cacheClient: CacheClient, walletFirstBlock: number) {
  console.log("Starting sync")
  let lastSyncedBlock: number = await cacheClient.getLastSyncedBlock() || walletFirstBlock
  while (true) {  // eslint-disable-line no-constant-condition
    const currentBlock = await cacheClient.getCurrentBlock()
    if (currentBlock === lastSyncedBlock) {
      break
    }
    await syncBlock(apiClient, cacheClient, lastSyncedBlock + 1)
    await cacheClient.setLastSyncedBlock(lastSyncedBlock + 1)
    lastSyncedBlock = lastSyncedBlock + 1
  }
}

const syncBlock = async function (apiClient: APIClient, cacheClient: CacheClient, blockSeqNo: number) {  // eslint-disable-line @typescript-eslint/no-unused-vars
  console.log("Syncing block " + blockSeqNo)
  const syncedWalletLastHash: string = await cacheClient.getSyncedWalletLastHash() || "unknown"
  const lastSyncedTransactionSeqNo: number = await cacheClient.getLastSyncedTransactionSeqNo() || -1
  const blockLite: BlockLite = await (await apiClient.getLiteBlock(blockSeqNo)).json()
  const lastHash: string = blockLite.account.last.hash
  if (lastHash === syncedWalletLastHash) {
    // New block but last transaction is the same, skip
    return
  }
  const lt = parseInt(blockLite.account.last.lt)

  const rawTransactions: TransactionsResponse = await (
    await apiClient.getTransactions(lt, lastHash)
  ).json()

  const transactions: Array<RawTransaction> = await apiClient.getTransactionsDetails(rawTransactions)

  // Transactions are ordered by seqNo desc
  for (let i = transactions.length - 1; i > 0; i--) {
    console.log(lastSyncedTransactionSeqNo, rawTransactions.blocks[i].seqno)

    if (lastSyncedTransactionSeqNo >= rawTransactions.blocks[i].seqno) {
      // Transactions can overlap in different responses, do not reprocess
      continue
    }

    const t = transactions[i]
    if (await isWithdrawTransaction(t)) {
      console.log("Process withdraw transaction")
      const senderAddr: string = t.outMessages[0]!.info!.src!.toString() // eslint-disable-line  @typescript-eslint/no-non-null-assertion
      const wallet = await getOrCreareWallet(senderAddr)
      // You can only make a full withdraw
      await deleteDeposits(wallet.id)
      
      // DB processing here
    } else {
      const amount: bigint = await isDepositTransaction(t)
      if (amount) {
        console.log("Process deposit transaction with amount: " + amount)
        const senderAddr: string = t.outMessages[0]!.info!.src!.toString() // eslint-disable-line  @typescript-eslint/no-non-null-assertion
        const wallet = await getOrCreareWallet(senderAddr)
        await createDeposit(wallet.id, amount, t.time)
      }
    }
  }

  await cacheClient.setLastSyncedTransactionSeqNo(rawTransactions.blocks[0].seqno)
  await cacheClient.setSyncedWalletLastHash(lastHash)
}


const getTransactionOutMessage = async function (transaction: RawTransaction) {
  if (transaction.outMessagesCount === 0) {
    return ''
  }
  return transaction.outMessages[0].body.bits.buffer.toString().replace(/\x00/g, '')  // eslint-disable-line no-control-regex
}


const isDepositTransaction = async function (transaction: RawTransaction) {
  const result: RegExpExecArray | null = stakeAccceptedRe.exec(await getTransactionOutMessage(transaction)) || null
  if (result === null) {
    return bigint(0)
  }
  return bigint(result.groups!.amount)  // eslint-disable-line @typescript-eslint/no-non-null-assertion
}

const isWithdrawTransaction = async function (transaction: RawTransaction) {
  return !!stakeWithdrawCompletedRe.exec(await getTransactionOutMessage(transaction))
}


const getOrCreareWallet = async function (walletAddr: string) {
  const wallet = await prisma.wallet.upsert({
    where: { address: walletAddr },
    create: { address: walletAddr },
    update: { address: walletAddr }
  })
  return wallet
}

const createDeposit = async function (walletId: number, amount: bigint, dateCreated: number) {
  const deposit = prisma.deposit.create({
    data: {
      amount: amount,
      walletId: walletId,
      dateCreated: new Date(dateCreated * 1000)
    }
  })
  return deposit
}

const deleteDeposits = async function (walletId: number) {
  const deleteWallet = await prisma.deposit.deleteMany({
    where: {
      walletId: walletId
    },
  })
  return deleteWallet
}