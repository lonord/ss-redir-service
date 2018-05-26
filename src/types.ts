export type SSMode = 'auto' | 'global'

export interface ProcessStat {
	pid: number
	cpu: number
	mem: number
}

export interface RunningStatus {
	running: boolean
	uptime: number
	ssMode: SSMode
	processStatus: { [x: string]: ProcessStat }
}

export interface ServiceController {
	start(): Promise<void>
	stop(): Promise<void>
	getStatus(): Promise<RunningStatus>
	getSSMode(): Promise<SSMode>
	setSSMode(mode: SSMode): Promise<void>
	addUserGFWDomain(domain: string): Promise<void>
	removeUserGFWDomain(domain: string): Promise<void>
	validateGFWList(): Promise<void>
	invalidateGFWList(): Promise<void>
	getUserGFWList(): Promise<string[]>
	updateStandardGFWList(): Promise<void>
}
