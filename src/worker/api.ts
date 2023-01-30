const apiBaseUrl: string | undefined = process.env.TSPE_API_BASE_URL
if (typeof apiBaseUrl === 'undefined') {
	throw Error('TSPE_API_BASE_URL is not set!')
}

const stakePoolWalletAddr: string | undefined = process.env.TSPE_STAKE_POOL_WALLET_ADDRESS
if (typeof stakePoolWalletAddr === 'undefined') {
	throw Error('TSPE_STAKE_POOL_WALLET_ADDRESS is not set!')
}


const stakingStatusExitCodeSucess = 0


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

	async getLatestBlock(): Promise<Response> {
		return fetch(apiBaseUrl + '/block/latest', {
			method: 'GET'
		})
	}

	async getStakingPoolFirstBlock(): Promise<number | null> {
		/**
		 * Use binary search to find the first metion of the staking wallet
		 */
		const latestBlockSeqNo: number = (await (await this.getLatestBlock()).json()).last.seqno

		console.log("Fetching " + latestBlockSeqNo)
		let exitCode: number = (await (await this.getStakingStatus(latestBlockSeqNo)).json()).exitCode

		if (exitCode !== stakingStatusExitCodeSucess) {
			// get_staking_status returns error for the latest block
			return null
		}

		let start = 0
		let end: number = latestBlockSeqNo
		let mid = 0
		while (true) {   // eslint-disable-line no-constant-condition
			if (end - start < 2) {
				// Should be either one of these
				exitCode = (await (await this.getStakingStatus(start)).json()).exitCode
				if (exitCode == stakingStatusExitCodeSucess) {
					console.log("Found " + start)
					return start
				} else {
					console.log("Found " + end)
					return end
				}
			}

			mid = Math.ceil(start + (end - start) / 2)
			console.log("Fetching " + mid)

			exitCode = (await (await this.getStakingStatus(mid)).json()).exitCode

			if (exitCode == stakingStatusExitCodeSucess) {
				end = mid
			} else {
				start = mid
			}
		}
	}
}
