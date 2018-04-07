#!/usr/bin/env node

import * as isRoot from 'is-root'
import * as ipc from 'json-ipc-lib'
import { sockFile } from '../../universal/constant'
import { RunningStatus } from '../types'
import { ServiceContext } from './service/base/base-service'
import createService from './service/service'
import createDependenceChecker from './util/check'
import createConfigManager from './util/config'

const serviceContext: ServiceContext = {
	isServiceRunning: false
}
const configMgr = createConfigManager()
const settingMgr = configMgr.getSettingManager()
const service = createService({
	config: configMgr.getConfig(),
	settingManager: settingMgr,
	context: serviceContext
})
const depedenceChecker = createDependenceChecker()

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

const handlers = {
	start: async () => {
		if (service.isRunning()) {
			return
		}
		serviceContext.isServiceRunning = true
		await service.start()
		settingMgr.updateSetting({
			ssEnable: true
		})
	},
	stop: async () => {
		serviceContext.isServiceRunning = false
		await service.stop()
		settingMgr.updateSetting({
			ssEnable: false
		})
	},
	getStatus: () => {
		return {} as any as RunningStatus
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

if (!isRoot()) {
	console.log('> ss-redir-service require root permission')
	process.exit(1)
}

depedenceChecker.check()

if (settingMgr.getSetting().ssEnable) {
	serviceContext.isServiceRunning = true
	service.start()
}

const server = new ipc.Server(
	sockFile,
	{ service: handlers }
)
server.listen()
console.log(`> ss-redir-service started, listening on sock file: ${sockFile}`)

const exit = async () => {
	console.log(`> ss-redir-service is going to exit ...`)
	serviceContext.isServiceRunning = false
	await closeIPCServer()
	await service.stop()
	process.exit(0)
}

const closeIPCServer = () => new Promise((resolve) => {
	server.close(() => resolve())
})
process.on('SIGINT', exit)
process.on('SIGTERM', exit)
process.on('uncaughtException', (err) => {
	service.stop().catch(() => {
		console.log('aaa')
	}).then(() => {
		console.error(err)
		process.exit(1)
	})
})
