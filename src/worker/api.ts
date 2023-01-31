import { RawTransaction, Slice, Cell, parseTransaction } from "ton";
import { TransactionsResponse } from './schema'


const apiBaseUrl: string | undefined = process.env.TSPE_API_BASE_URL
if (typeof apiBaseUrl === 'undefined') {
	throw Error('TSPE_API_BASE_URL is not set!')
}

const stakePoolWalletAddr: string | undefined = process.env.TSPE_STAKE_POOL_WALLET_ADDRESS
if (typeof stakePoolWalletAddr === 'undefined') {
	throw Error('TSPE_STAKE_POOL_WALLET_ADDRESS is not set!')
}


const accountActiveState = 'active'


export class APIClient {
	async getStakingStatus(blockSeqNo: number): Promise<Response> {
		return fetch(apiBaseUrl + '/block/' + blockSeqNo.toString() + '/' + stakePoolWalletAddr + '/run/get_staking_status', {
			method: 'GET'
		})
	}

	async getFullBlock(blockSeqNo: number): Promise<Response> {
		return fetch(apiBaseUrl + '/block/' + blockSeqNo.toString(), {
			method: 'GET'
		})
	}

	async getLiteBlock(blockSeqNo: number): Promise<Response> {
		return fetch(apiBaseUrl + '/block/' + blockSeqNo.toString() + '/' + stakePoolWalletAddr + '/lite', {
			method: 'GET'
		})
	}

	async getLatestBlock(): Promise<Response> {
		return fetch(apiBaseUrl + '/block/latest', {
			method: 'GET'
		})
	}

	async getTransactions(lt: number, hash: string) : Promise<Response> {
		return fetch(apiBaseUrl + '/account/' + stakePoolWalletAddr + '/tx/' + lt + '/' + encodeURIComponent(hash), {
			method: 'GET'
		})
	}

	async getStakingPoolFirstBlock(): Promise<number | null> {
		/**
		 * Use binary search to find the first block at which the account was active
		 */
		const latestBlockSeqNo: number = (await (await this.getLatestBlock()).json()).last.seqno

		console.log("Fetching " + latestBlockSeqNo)
		let accountStatus: string = (await (await this.getLiteBlock(latestBlockSeqNo)).json()).account.state.type

		if (accountStatus !== accountActiveState) {
			// account is not active at the latest block
			return null
		}

		let start = 0
		let end: number = latestBlockSeqNo
		let mid = 0
		while (true) {   // eslint-disable-line no-constant-condition
			if (end - start < 2) {
				// Should be either one of these
				accountStatus = (await (await this.getLiteBlock(start)).json()).account.state.type
				if (accountStatus === accountActiveState) {
					console.log("Found " + start)
					return start
				} else {
					console.log("Found " + end)
					return end
				}
			}

			mid = Math.ceil(start + (end - start) / 2)
			console.log("Fetching " + mid)

			accountStatus = (await (await this.getLiteBlock(mid)).json()).account.state.type

			if (accountStatus == accountActiveState) {
				end = mid
			} else {
				start = mid
			}
		}
	}

	async getTransactionsDetails(transactionsResponse: TransactionsResponse) {
		const transactions: Array<RawTransaction> = Array<RawTransaction>()
		const workchain: number = transactionsResponse.blocks[0].workchain
		const cells: Array<Cell> = Cell.fromBoc(new Buffer(transactionsResponse.boc, 'base64'))
		for (const cell of cells) {
			transactions.push(parseTransaction(workchain, Slice.fromCell(cell)))
		}
		return transactions
	}
}
