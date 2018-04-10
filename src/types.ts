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
