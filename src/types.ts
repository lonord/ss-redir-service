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
	getForwardIPList(): Promise<string[]>
	addForwardIP(ip: string): Promise<void>
	removeForwardIP(ip: string): Promise<void>
	getBypassIPList(): Promise<string[]>
	addBypassIP(ip: string): Promise<void>
	removeBypassIP(ip: string): Promise<void>
	getForwardClientIPList(): Promise<string[]>
	addForwardClientIP(ip: string): Promise<void>
	removeForwardClientIP(ip: string): Promise<void>
	getBypassClientIPList(): Promise<string[]>
	addBypassClientIP(ip: string): Promise<void>
	removeBypassClientIP(ip: string): Promise<void>
	addUserGFWDomain(domain: string): Promise<void>
	removeUserGFWDomain(domain: string): Promise<void>
	validateGFWList(): Promise<void>
	invalidateGFWList(): Promise<void>
	getUserGFWList(): Promise<string[]>
	updateStandardGFWList(): Promise<void>
	getVersion(): Promise<string>
}
