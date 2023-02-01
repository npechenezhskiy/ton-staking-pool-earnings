export class APIClient {
	async getLastestElections(): Promise<Response> {
		return fetch('https://connect.tonhubapi.com/net/mainnet/elections/latest', {
			method: 'GET'
		})
	}

	async getElectionsById(electionsId: number): Promise<Response> {
		return fetch("https://connect.tonhubapi.com/net/mainnet/elections/" + electionsId, {
			method: 'GET'
		})
	}
}
