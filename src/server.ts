#!/usr/bin/env node

import * as program from 'commander'
import * as isRoot from 'is-root'
import { platform } from 'os'
import withServiceUptime from './decorator/service-uptime'
import { ServiceContext } from './service/base/base-service'
import createService from './service/service'
import { RunningStatus, ServiceController } from './types'
import createDependenceChecker from './util/check'
import createConfigManager from './util/config'
import createWebService from './webservice/webservice'

// tslint:disable-next-line:no-var-requires
const pkg = require('../package.json')

if (platform() !== 'linux') {
	console.log('ss-redir-service only support linux platform')
	process.exit(0)
}

program
	.version(pkg.version)
	.description(pkg.description)
	.option('-v, --verbose')
	.option('-p, --port <n>')
	.option('-h, --host <n>')
	.parse(process.argv)

const serviceContext: ServiceContext = {
	isServiceRunning: false
}
const configMgr = createConfigManager()
const settingMgr = configMgr.getSettingManager()
const service = withServiceUptime(createService({
	config: configMgr.getConfig(),
	settingManager: settingMgr,
	context: serviceContext,
	verbose: !!program.verbose
}))
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

const controller: ServiceController = {
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
	getStatus: async () => {
		const s: RunningStatus = {
			running: service.isRunning(),
			uptime: service.getUptime(),
			ssMode: service.getSSMode(),
			processStatus: await service.getStatus()
		}
		return s
	},
	getSSMode: async () => getSSMode(),
	setSSMode,
	addUserGFWDomain,
	removeUserGFWDomain,
	validateGFWList,
	invalidateGFWList,
	getUserGFWList: async () => getUserGFWList(),
	updateStandardGFWList,
	getVersion: async () => pkg.version
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

const server = createWebService(controller)
const httpPort = isNaN(parseInt(program.port)) ? 11080 : parseInt(program.port)
const httpHost = program.host || '0.0.0.0'
server.start(httpPort, httpHost).then(() => {
	console.log(`> ss-redir-service started, listening on: http://${httpHost}:${httpPort}`)
})

const exit = async () => {
	console.log(`> ss-redir-service is going to exit ...`)
	serviceContext.isServiceRunning = false
	await server.stop()
	await service.stop()
	process.exit(0)
}

process.on('SIGINT', exit)
process.on('SIGTERM', exit)
process.on('uncaughtException', (err) => {
	service.stop().catch(() => {
		// ignore
	}).then(() => {
		console.error(err)
		process.exit(1)
	})
})
