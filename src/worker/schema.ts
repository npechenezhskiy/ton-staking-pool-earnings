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
        [key: string]: ChangedItem
    }
}

interface Transaction {
    account: string,
    hash: string,
    lt: string
}

interface Shard extends BlockBase {
    transactions: Array<Transaction>
}

export interface BlockFullAPI {
    exist: boolean,
    block: {
        shards: Array<Shard>
    }
}


interface BlockTransaction {
    workchain: number,
    shard: string,
    seqno: number
}


export interface TransactionsResponse {
    boc: string,
    blocks: BlockTransaction[]
}

interface Balance {
    coins: string,
    currencies: object
}

interface Last {
    hash: string,
    lt: string
}

interface State {
    codeHash: string,
    dataHash: string,
    type: string
}

interface Used {
    bits: number,
    cells: number,
    publicCells: number
}

interface StorageStat {
    duePayment: number | null,
    lastPaid: number,
    used: Used
}

interface Account {
    balance: Balance,
    last: Last,
    state: State,
    storageStat: StorageStat
}

export interface BlockLite {
    account: Account
}

interface Group {
    group1: string
}

export interface DepositTransactionRegExpExec {
    groups: Group
}
