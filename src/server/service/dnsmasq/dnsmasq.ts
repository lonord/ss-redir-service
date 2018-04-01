import { exec } from 'child_process'
import { writeFile } from 'fs'
import * as _ from 'lodash'
import { join } from 'path'
import { promisify } from 'util'
import { BaseServiceOption } from '../base/base-service'

const execAsync = promisify(exec)
const writeFileAsync = promisify(writeFile)

export interface DnsmasqService {
	getUserGFWList(): string[]
	addUserGFWDomain(domain: string)
	removeUserGFWDomain(domain: string)
	applyUserGFWList(): Promise<void>
	updateStandardGFWList(): Promise<void>
}

export default function createDnsmasqService(option: BaseServiceOption): DnsmasqService {
	const c = option.config

	let userGFWList: string[] = option.settingManager.getSetting().userGFWList

	async function reloadDnsmasq() {
		await execAsync(c.dnsmasqReloadCommand)
	}

	async function writeUserGFWListFile() {
		const file = join(c.dnsmasqConfigDir, 'user.conf')
		const content = userGFWList
			.map((g) => `server=/${g}/127.0.0.1#${c.dnsTunPort}\nipset=/${g}/${c.gfwIpsetName}`)
			.join('\n')
		await writeFileAsync(file, content, 'utf8')
	}

	return {
		getUserGFWList: () => [
			...userGFWList
		],
		addUserGFWDomain: (domain) => {
			userGFWList = _.concat(userGFWList, domain)
		},
		removeUserGFWDomain: (domain) => {
			userGFWList = [
				...userGFWList
			]
			_.pull(userGFWList, domain)
		},
		applyUserGFWList: async () => {
			await writeUserGFWListFile()
			await reloadDnsmasq()
		},
		updateStandardGFWList: async () => {
			const dir = join(__dirname, '../../../../assets/bin')
			const s = join(c.dnsmasqConfigDir, 'gfwlist.conf')
			await execAsync(`gfwlist2dnsmasq.sh -d 127.0.0.1 -p ${c.dnsTunPort} -s ${c.gfwIpsetName} -o ${s}`, {
				cwd: dir
			})
			await reloadDnsmasq()
		}
	}
}
