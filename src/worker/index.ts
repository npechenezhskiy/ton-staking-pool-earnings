import { WebSocket, MessageEvent } from 'ws'
import { BlockFullWS } from './schema'
import { CacheClient } from './cache'
import { APIClient } from './api'

const apiBaseUrl: string | undefined = process.env.TSPE_API_BASE_URL
if (typeof apiBaseUrl === 'undefined') {
  throw Error('TSPE_API_BASE_URL is not set!')
}

const stakingPoolAddress: string | undefined = process.env.TSPE_STAKE_POOL_WALLET_ADDRESS
if (typeof stakingPoolAddress === 'undefined') {
  throw Error('TSPE_STAKE_POOL_WALLET_ADDRESS is not set!')
}

const wsBaseUrl: string = apiBaseUrl.replace('http://', 'ws://')
const wsWatchBlockChangeUrl: string = wsBaseUrl + '/block/watch/changed'
const ws: WebSocket = new WebSocket(wsWatchBlockChangeUrl)

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
    if (blockSeqNo - lastSyncedBlock == 1) {
      // Sync is up to date
      await syncBlock(blockSeqNo)
      await cacheClient.setLastSyncedBlock(blockSeqNo)
      syncRunning = false
    } else {
      // Sync to catch up
      if (syncRunning) {
        // Sync is running already, nothing to do
        return
      }
      performSync(cacheClient, walletFirstBlock)
      syncRunning = true
    }
  }
}


const performSync = async function (cacheClient: CacheClient, walletFirstBlock: number) {
  console.log("Starting sync")
  let lastSyncedBlock: number  = await cacheClient.getLastSyncedBlock() || walletFirstBlock
  while (true) {  // eslint-disable-line no-constant-condition
    const currentBlock = await cacheClient.getCurrentBlock()
    if (currentBlock === lastSyncedBlock) {
      break
    }
    await syncBlock(lastSyncedBlock + 1)
    await cacheClient.setLastSyncedBlock(lastSyncedBlock + 1)
    lastSyncedBlock = lastSyncedBlock + 1
  }
}

const syncBlock = async function (blockSeqNo: number) {  // eslint-disable-line @typescript-eslint/no-unused-vars
  // TODO
}