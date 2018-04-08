import { BaseService } from '../service/base/base-service'

export interface ServiceUptimeProps {
	getUptime(): number
}

export default function withServiceUptime<T extends BaseService>(service: T): T & ServiceUptimeProps {
	let startTime: number = 0
	return {
		...(service as any),
		start: async () => {
			if (!service.isRunning()) {
				startTime = new Date().getTime()
			}
			await service.start()
		},
		stop: async () => {
			startTime = 0
			await service.stop()
		},
		getUptime: () => {
			if (startTime === 0) {
				return 0
			}
			const n = new Date().getTime()
			return n - startTime
		}
	}
}
