import * as pidusage from 'pidusage'
import { isNumber } from 'util'
import { DeamonService } from '../service/base/deamon-service'
import { ProcessStat } from '../types'

export interface ProcessStatusProps {
	getProcessStatus(): Promise<ProcessStat>
}

export default function withProcessStatus<T extends DeamonService>(service: T): T & ProcessStatusProps {
	return {
		...(service as any),
		getProcessStatus: async () => {
			const child = service.getChildProcess()
			if (!child || !isNumber(child.pid)) {
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
