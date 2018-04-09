import { DeamonService } from '../service/base/deamon-service'

export interface ProcessStatusProps {
	getPid(): number
}

export default function withProcessStatus<T extends DeamonService>(service: T): T & ProcessStatusProps {
	return {
		...(service as any),
		getPid: () => 0
	}
}
