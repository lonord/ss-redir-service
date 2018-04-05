import { ChildProcess, spawn } from 'child_process'
import { arch, platform } from 'os'
import { join } from 'path'
import { isArray, isFunction, isString } from 'util'
import { binDir } from '../../../../universal/constant'
import createBaseService, { BaseService, BaseServiceOption } from './base-service'

export interface DeamonService extends BaseService {
	getChildProcess(): ChildProcess
}

export interface DeamonServiceOption extends BaseServiceOption {
	command: string | (() => string)
	args: string[] | (() => string[])
}

export default function createDeamonService(option: DeamonServiceOption): DeamonService {
	const sup = createBaseService(option)
	let cp: ChildProcess = null

	function onProcessExit(code: number, signal: string) {
		cp = null
		console.log(`${option.command} exited with code ${code} and signal ${signal}, restart it`)
		startProcess()
	}

	async function startProcess() {
		await stopProcess()
		cp = spawn(getCommand(option.command), getArgs(option.args), {
			cwd: binDir,
			env: process.env
		})
		cp.once('close', onProcessExit)
	}

	async function stopProcess() {
		await new Promise((resolve) => {
			if (cp) {
				cp.removeAllListeners()
				cp.once('close', () => {
					cp = null
					resolve()
				})
				cp.kill()
			} else {
				resolve()
			}
		})
	}

	return {
		...sup,
		start: async () => {
			if (sup.isRunning()) {
				return
			}
			await sup.start()
			await startProcess()
		},
		stop: async () => {
			await stopProcess()
			await sup.stop()
		},
		getChildProcess: () => {
			return cp
		}
	}
}

function getCommand(command: string | (() => string)): string {
	if (isString(command)) {
		return command
	}
	if (isFunction(command)) {
		return command()
	}
}

function getArgs(args: string[] | (() => string[])): string[] {
	if (isArray(args)) {
		return args
	}
	if (isFunction(args)) {
		return args()
	}
	return []
}
