import { WebSocket, MessageEvent } from 'ws'

const apiBaseUrl: string | undefined = process.env.TSPE_API_BASE_URL

if (typeof apiBaseUrl === 'undefined') {
  throw Error('TSPE_API_BASE_URL is not set!')
}

const wsBaseUrl: string = apiBaseUrl.replace('http://', 'ws://')
const wsWatchBlockChangeUrl: string = wsBaseUrl + '/block/watch/changed'
const ws: WebSocket = new WebSocket(wsWatchBlockChangeUrl)

ws.onmessage = (message: MessageEvent) => {
  console.log(message.data);
}
