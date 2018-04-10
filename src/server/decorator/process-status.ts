import * as pidusage from 'pidusage'
import { ProcessStat } from '../../types'
import { DeamonService } from '../service/base/deamon-service'

export interface ProcessStatusProps {
	getProcessStatus(): Promise<ProcessStat>
}

export default function withProcessStatus<T extends DeamonService>(service: T): T & ProcessStatusProps {
	const child = service.getChildProcess()
	return {
		...(service as any),
		getProcessStatus: async () => {
			if (!child.connected || child.killed) {
				return {
					pid: -1,
					cpu: -1,
					mem: -1
				}
			}
			const s = await pidusage(child.pid)
			return {
				pid: child.pid,
				cpu: Math.floor(s.cpu),
				mem: s.memory
			}
		}
	}
}
