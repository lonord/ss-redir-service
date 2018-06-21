import { exec } from 'child_process'
import { writeFile } from 'fs'
import * as _ from 'lodash'
import fetch from 'node-fetch'
import { join } from 'path'
import * as rimraf from 'rimraf'
import { promisify } from 'util'
import { isCmdDnsmasqReloaderConfig, isHttpDnsmasqReloaderConfig } from '../../util/config'
import fetchGfwlist from '../../util/gfwlist-fetcher'
import { BaseServiceOption } from '../base/base-service'

const execAsync = promisify(exec)
const writeFileAsync = promisify(writeFile)
const rimrafAsync = promisify(rimraf)

export interface DnsmasqService {
	getUserGFWList(): string[]
	addUserGFWDomain(domain: string): Promise<void>
	removeUserGFWDomain(domain: string): Promise<void>
	updateStandardGFWList(): Promise<void>
	validateGFWList(): Promise<void>
	invalidateGFWList(): Promise<void>
}

export default function createDnsmasqService(option: BaseServiceOption): DnsmasqService {
	const c = option.config

	let userGFWList = option.settingManager.getSetting().userGFWList
	let standardGFWList = option.settingManager.getSetting().standardGFWList

	async function reloadDnsmasq() {
		if (isCmdDnsmasqReloaderConfig(c.dnsmasqReloaderConfig)) {
			await execAsync(c.dnsmasqReloaderConfig.command)
		} else if (isHttpDnsmasqReloaderConfig(c.dnsmasqReloaderConfig)) {
			await fetch(c.dnsmasqReloaderConfig.url, {
				method: c.dnsmasqReloaderConfig.method,
				headers: c.dnsmasqReloaderConfig.header,
				body: c.dnsmasqReloaderConfig.body
			})
		}
	}

	async function writeGFWListFile() {
		const file = join(c.dnsmasqConfigDir, c.gfwlistFileName)
		const gfwlist = [
			...standardGFWList,
			...userGFWList
		]
		const content = gfwlist
			.map((g) => `server=/${g}/127.0.0.1#${c.dnsTunPort}\nipset=/${g}/${c.gfwIpsetName}`)
			.join('\n')
		await writeFileAsync(file, content, 'utf8')
	}

	async function removeGFWListFile() {
		const file = join(c.dnsmasqConfigDir, c.gfwlistFileName)
		try {
			await rimrafAsync(file)
		} catch (err) {
			// ignore
		}
	}

	const saveUserGFWListSetting = _.debounce(() => {
		option.settingManager.updateSetting({
			userGFWList
		})
	}, 100)

	return {
		getUserGFWList: () => [
			...userGFWList
		],
		addUserGFWDomain: async (domain) => {
			if (userGFWList.indexOf(domain) !== -1) {
				_.pull(userGFWList, domain)
			}
			userGFWList = _.concat(userGFWList, domain)
			saveUserGFWListSetting()
		},
		removeUserGFWDomain: async (domain) => {
			if (userGFWList.indexOf(domain) === -1) {
				return
			}
			userGFWList = [
				...userGFWList
			]
			_.pull(userGFWList, domain)
			saveUserGFWListSetting()
		},
		updateStandardGFWList: async () => {
			standardGFWList = await fetchGfwlist()
			option.settingManager.updateSetting({
				standardGFWList
			})
		},
		validateGFWList: async () => {
			await writeGFWListFile()
			await reloadDnsmasq()
		},
		invalidateGFWList: async () => {
			await removeGFWListFile()
			await reloadDnsmasq()
		}
	}
}
