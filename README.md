# ton-staking-pool-earnings
Check how much you've earned from the staking pool.

## Features:
* Fully containerized
* Real-time updates
* Automatic upsync from the blockchain if the execution is terminated

## Running
1. `cp .env.example .env`
2. Change the contents of the `.env` file to your needs
3. `make run-docker`


# Project overview


## Backend

A container with a webserver that serves the only API endpoint:
```
Request:

/<wallet address>

Response:

404: wallet with the provided address is not found (is not participating in the staking)
200: {
    "balance" : <total staking amount>,
    "totalEarnings ": <the number of coins the staker will receive *in addition* to their stake if they've withdrawed immediately>
}
```

The backend pod fetches all of the deposits associated with the wallet from the request path and performs a simple profit computation that depends on for how long this specific deposit exists.

## Worker

The worker container performs 3 basic operations:

1. Get from cache or find the first block the staking wallet is active at
2. If the syncing is up-to-date, listen for the new blocks via a websocket and process them one-by-one
3. If the syncing is not up-to-date, sync data from blockchain first and then listen for the websocket events. Sync starts from the last synced block if exists in cache else from the block from #1

The execution relies on the assumption that the syncing process will catch up to the latest block at some point.

N.B: Worker implements caching meaning on every launch the container first checks if the data is in sync (data might not be in sync because the initial syncing / general container execution was terminated). Thanks to this, on every launch the container will continue exactly from the block it last processed before it was terminated.


## ton-api-v4

Self-hosted instance of [ton-api-v4](https://github.com/ton-community/ton-api-v4/)


## redis

A `redis` instance for caching.


## db

A `postgresql` instance for long-term storage.
