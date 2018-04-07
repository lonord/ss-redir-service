import { Client } from 'json-ipc-lib'
import { sockFile } from '../../universal/constant'
import { RunningStatus, SSMode } from '../types'

export interface IPCMethods {
	start(): Promise<void>
	stop(): Promise<void>
	getStatus(): Promise<RunningStatus>
	getSSMode(): Promise<SSMode>
	setSSMode(mode: SSMode): Promise<void>
	getUserGFWList(): Promise<string[]>
	addUserGFWDomain(domain: string): Promise<void>
	removeUserGFWDomain(domain: string): Promise<void>
	updateStandardGFWList(): Promise<void>
	validateGFWList(): Promise<void>
	invalidateGFWList(): Promise<void>
}

export default function createClient(): IPCMethods {
	const client = new Client(sockFile, { timeout: 10000 })
	return new Proxy({}, {
		get: (target, name) => {
			if (name in target) {
				return target[name]
			} else {
				const fn = async (...g) => {
					const argList = Array.prototype.slice.apply(g) as any[]
					argList.unshift(`service.${name}`)
					const result = await client.call(argList)
					return result
				}
				target[name] = fn
				return fn
			}
		},
		set: () => true
	}) as IPCMethods
}
