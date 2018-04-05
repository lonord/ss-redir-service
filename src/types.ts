export type SSMode = 'auto' | 'global'

export interface RunningStatus {
	running: boolean
	uptime: number
}

export interface SSNatMethods {
	getSSMode(): SSMode
	setSSMode(mode: SSMode): Promise<void>
}

export interface DnsmasqMethods {
	getUserGFWList(): string[]
	addUserGFWDomain(domain: string)
	removeUserGFWDomain(domain: string)
	updateStandardGFWList(): Promise<void>
	validateGFWList(): Promise<void>
	invalidateGFWList(): Promise<void>
}

export interface RPCMethods extends SSNatMethods, DnsmasqMethods {
	start(): Promise<void>
	stop(): Promise<void>
	getStatus(): RunningStatus
}
