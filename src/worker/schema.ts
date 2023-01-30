interface ResultObj {
    type: string,
    value: string
}

interface BlockBase {
    workchain: number,
    seqno: number,
    shard: string,
    rootHash: string,
    fileHash: string

}

export interface StakingStatus {
    arguments: Array<string>,
    result: Array<ResultObj>,
    exitCode: number,
    resultRaw: string,
    block: BlockBase,
    shardBlock: BlockBase
}


interface ChangedItem {
    lt: string,
    hash: string
}

export interface BlockFullWS {
    seqno: number,
    changed: {
        [key: string] : ChangedItem
    }
}

interface Transaction {
    account: string,
    hash: string,
    lt: string
}

interface Shard extends BlockBase{
    transactions: Array<Transaction>
}

export interface BlockFullAPI {
    exist: boolean,
    block: {
        shards: Array<Shard>
    }
}