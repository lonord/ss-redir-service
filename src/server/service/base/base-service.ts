import { ConfigProps } from '../util/config'

export interface BaseService {
	start()
	stop()
	isRunning(): boolean
}

export interface BaseServiceOption {
	config: ConfigProps
}

export default function createBaseService(option: BaseServiceOption): BaseService {
	let running = false
	return {
		start: () => {
			running = true
		},
		stop: () => {
			running = false
		},
		isRunning: () => {
			return running
		}
	}
}
