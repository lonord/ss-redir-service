export type SSMode = 'auto' | 'global'

export interface RunningStatus {
	running: boolean
	uptime: number
}

export interface SSNatMethods {
	getSSMode(): SSMode
	setSSMode(mode: SSMode)
}

export interface DnsmasqMethods {
	getUserGFWList(): string[]
	addUserGFWDomain(domain: string)
	removeUserGFWDomain(domain: string)
	applyUserGFWList(): Promise<void>
	updateStandardGFWList(): Promise<void>
}

export interface RPCMethods extends SSNatMethods, DnsmasqMethods {
	start()
	stop()
	getStatus(): RunningStatus
}
