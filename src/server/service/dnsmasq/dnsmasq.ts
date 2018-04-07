import { exec } from 'child_process'
import { writeFile } from 'fs'
import * as _ from 'lodash'
import { join } from 'path'
import * as rimraf from 'rimraf'
import { promisify } from 'util'
import fetchGfwlist from '../../util/gfwlist-fetcher'
import { BaseServiceOption } from '../base/base-service'

const execAsync = promisify(exec)
const writeFileAsync = promisify(writeFile)
const rimrafAsync = promisify(rimraf)

export interface DnsmasqService {
	getUserGFWList(): string[]
	addUserGFWDomain(domain: string)
	removeUserGFWDomain(domain: string)
	updateStandardGFWList(): Promise<void>
	validateGFWList(): Promise<void>
	invalidateGFWList(): Promise<void>
}

export default function createDnsmasqService(option: BaseServiceOption): DnsmasqService {
	const c = option.config

	let userGFWList = option.settingManager.getSetting().userGFWList
	let standardGFWList = option.settingManager.getSetting().standardGFWList

	async function reloadDnsmasq() {
		await execAsync(c.dnsmasqReloadCommand)
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
		addUserGFWDomain: (domain) => {
			userGFWList = _.concat(userGFWList, domain)
			saveUserGFWListSetting()
		},
		removeUserGFWDomain: (domain) => {
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
