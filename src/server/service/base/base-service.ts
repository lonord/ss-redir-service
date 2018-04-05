import { ConfigProps, SettingManager } from '../../util/config'

export interface ServiceContext {
	isServiceRunning: boolean
}

export interface BaseService {
	start(): Promise<void>
	stop(): Promise<void>
	isRunning(): boolean
}

export interface BaseServiceOption {
	config: ConfigProps
	settingManager: SettingManager
	context: ServiceContext
}

export default function createBaseService(option: BaseServiceOption): BaseService {
	let running = false
	return {
		start: async () => {
			running = true
		},
		stop: async () => {
			running = false
		},
		isRunning: () => {
			return running
		}
	}
}
