import * as ipc from 'json-ipc-lib'
import { sockFile } from '../../universal/constant'
import { RPCMethods, SSMode } from '../types'
import createService from './service/service'
import createConfigManager from './util/config'

const configMgr = createConfigManager()
const settingMgr = configMgr.getSettingManager()
const service = createService({
	config: configMgr.getConfig(),
	settingManager: settingMgr
})

const {
	getSSMode,
	setSSMode,
	addUserGFWDomain,
	removeUserGFWDomain,
	validateGFWList,
	invalidateGFWList,
	getUserGFWList,
	updateStandardGFWList
} = service

const handlers: RPCMethods = {
	start: async () => {
		if (service.isRunning()) {
			return
		}
		await service.start()
		settingMgr.updateSetting({
			ssEnable: true
		})
	},
	stop: async () => {
		await service.stop()
		settingMgr.updateSetting({
			ssEnable: false
		})
	},
	getStatus: () => {
		return {} as any
	},
	getSSMode,
	setSSMode,
	addUserGFWDomain,
	removeUserGFWDomain,
	validateGFWList,
	invalidateGFWList,
	getUserGFWList,
	updateStandardGFWList
}

if (settingMgr.getSetting().ssEnable) {
	service.start()
}

const server = new ipc.Server(
	sockFile,
	{ handlers })
server.listen()
console.log(`> ss-redir-service started, listening on sock file: ${sockFile}`)

const exit = () => {
	console.log(`> ss-redir-service is going to exit ...`)
	service.stop()
}
process.on('SIGINT', exit)
process.on('SIGTERM', exit)
