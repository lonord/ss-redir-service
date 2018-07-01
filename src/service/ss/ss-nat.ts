import * as binDir from '@lonord/ss-redir-service-bin'
import { exec, execSync, spawn } from 'child_process'
import { writeFile } from 'fs'
import * as _ from 'lodash'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import { SSMode } from '../../types'
import createBaseService, { BaseService, BaseServiceOption } from '../base/base-service'

const execAsync = promisify(exec)

const IPT = 'iptables -t nat'
const SS_TAG = 'SS_SPEC'
const CHAIN_WAN_AC = SS_TAG + '_WAN_AC'
const CHAIN_WAN_FW = SS_TAG + '_WAN_FW'
const IPSET_WAN_IG = 'ss_spec_wan_ig'
const IPSET_WAN_AC = 'ss_spec_wan_ac'
const IPSET_WAN_FW = 'ss_spec_wan_fw'
const IPSET_LAN_AC = 'ss_spec_lan_ac'
const IPSET_LAN_FW = 'ss_spec_lan_fw'

export interface SSNatService extends BaseService {
	getSSMode(): SSMode
	setSSMode(mode: SSMode): Promise<void>
	getForwardIPList(): string[]
	addForwardIP(ip: string): Promise<void>
	removeForwardIP(ip: string): Promise<void>
	getBypassIPList(): string[]
	addBypassIP(ip: string): Promise<void>
	removeBypassIP(ip: string): Promise<void>
	getForwardClientIPList(): string[]
	addForwardClientIP(ip: string): Promise<void>
	removeForwardClientIP(ip: string): Promise<void>
	getBypassClientIPList(): string[]
	addBypassClientIP(ip: string): Promise<void>
	removeBypassClientIP(ip: string): Promise<void>
}

export default function createSSNatService(option: BaseServiceOption): SSNatService {
	const c = option.config
	const sup = createBaseService(option)

	let ssMode: SSMode = option.settingManager.getSetting().ssMode
	let forwardIPList = option.settingManager.getSetting().forwardIPList
	let bypassIPList = option.settingManager.getSetting().bypassIPList
	let forwardClientIPList = option.settingManager.getSetting().forwardClientIPList
	let bypassClientIPList = option.settingManager.getSetting().bypassClientIPList

	async function setNatRules() {
		await unsetNatRules()

		// create forward chain
		await execCommand(`${IPT} -N ${CHAIN_WAN_FW}`)
		await execCommand(`${IPT} -A ${CHAIN_WAN_FW} -p tcp -j REDIRECT --to-ports ${c.localPort}`)

		// create access control chain
		await execCommand(`${IPT} -N ${CHAIN_WAN_AC}`)
		if (ssMode === 'auto') {
			// internal ignore
			await execIpsetActions(_.concat(
				[
					`create ${IPSET_WAN_IG} hash:net`
				],
				_.concat(
					internalBypassNetList,
					[c.serverHost],
					c.excludeIPList
				).map((ip) => `add ${IPSET_WAN_IG} ${ip}`)
			))
			await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -m set --match-set ${IPSET_WAN_IG} dst -j RETURN`)
			// bypass client ip
			if (bypassClientIPList.length > 0) {
				await execIpsetActions(_.concat(
					[
						`create ${IPSET_LAN_AC} hash:net`
					],
					bypassClientIPList.map((ip) => `add ${IPSET_LAN_AC} ${ip}`)
				))
				await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -m set --match-set ${IPSET_LAN_AC} src -j RETURN`)
			}
			// force forward client ip
			if (forwardClientIPList.length > 0) {
				await execIpsetActions(_.concat(
					[
						`create ${IPSET_LAN_FW} hash:net`
					],
					forwardClientIPList.map((ip) => `add ${IPSET_LAN_FW} ${ip}`)
				))
				await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -m set --match-set ${IPSET_LAN_FW} src -j ${CHAIN_WAN_FW}`)
			}
			// bypass ip
			if (bypassIPList.length > 0) {
				await execIpsetActions(_.concat(
					[
						`create ${IPSET_WAN_AC} hash:net`
					],
					bypassIPList.map((ip) => `add ${IPSET_WAN_AC} ${ip}`)
				))
				await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -m set --match-set ${IPSET_WAN_AC} dst -j RETURN`)
			}
			// force forward ip
			if (forwardIPList.length > 0) {
				await execIpsetActions(_.concat(
					[
						`create ${IPSET_WAN_FW} hash:net`
					],
					forwardIPList.map((ip) => `add ${IPSET_WAN_FW} ${ip}`)
				))
				await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -m set --match-set ${IPSET_WAN_FW} dst -j ${CHAIN_WAN_FW}`)
			}
			// forward gfwlist ip
			await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -m set ! --match-set ${c.gfwIpsetName} dst -j RETURN`)
		}
		// the rest is to forward
		await execCommand(`${IPT} -A ${CHAIN_WAN_AC} -j ${CHAIN_WAN_FW}`)

		// setup forward in PREROUTING and OUTPUT chains
		await execCommand(`${IPT} -I PREROUTING 1 -i ${c.lanInterface} -p tcp -j ${CHAIN_WAN_AC}`)
		await execCommand(`${IPT} -I OUTPUT 1 -p tcp -j ${CHAIN_WAN_AC}`)
	}

	async function unsetNatRules() {
		await execCommand(`iptables-save -c | grep -v ${SS_TAG} | iptables-restore -c`)
		await execIpsetActions([
			`destroy ${IPSET_LAN_AC}`,
			`destroy ${IPSET_WAN_AC}`,
			`destroy ${IPSET_LAN_FW}`,
			`destroy ${IPSET_WAN_FW}`,
			`destroy ${IPSET_WAN_IG}`
		])
	}

	const refreshIpsetLanAC = async () => {
		await execIpsetActions(_.concat(
			[
				`flush ${IPSET_LAN_AC}`
			],
			bypassClientIPList.map((ip) => `add ${IPSET_LAN_AC} ${ip}`)
		))
	}

	const refreshIpsetWanAC = async () => {
		await execIpsetActions(_.concat(
			[
				`flush ${IPSET_WAN_AC}`
			],
			bypassIPList.map((ip) => `add ${IPSET_WAN_AC} ${ip}`)
		))
	}

	const refreshIpsetLanFW = async () => {
		await execIpsetActions(_.concat(
			[
				`flush ${IPSET_LAN_FW}`
			],
			forwardClientIPList.map((ip) => `add ${IPSET_LAN_FW} ${ip}`)
		))
	}

	const refreshIpsetWanFW = async () => {
		await execIpsetActions(_.concat(
			[
				`flush ${IPSET_WAN_FW}`
			],
			forwardIPList.map((ip) => `add ${IPSET_WAN_FW} ${ip}`)
		))
	}

	const saveIPListSetting = _.debounce(() => {
		option.settingManager.updateSetting({
			forwardIPList,
			bypassIPList
		})
	}, 100)

	const saveClientIPListSetting = _.debounce(() => {
		option.settingManager.updateSetting({
			forwardClientIPList,
			bypassClientIPList
		})
	}, 100)

	return {
		...sup,
		start: async () => {
			if (sup.isRunning()) {
				return
			}
			await sup.start()
			try {
				await setNatRules()
			} catch (err) {
				console.error('set nat rules error: ', err)
			}
		},
		stop: async () => {
			try {
				await unsetNatRules()
			} catch (err) {
				console.error('unset nat rules error: ', err)
			}
			await sup.stop()
		},
		getSSMode: () => {
			return ssMode
		},
		setSSMode: async (mode) => {
			ssMode = mode
			if (sup.isRunning()) {
				try {
					await setNatRules()
				} catch (err) {
					console.error('update ss mode error: ', err)
				}
			}
			option.settingManager.updateSetting({
				ssMode
			})
		},
		getForwardIPList: () => {
			return option.settingManager.getSetting().forwardIPList
		},
		addForwardIP: async (ip: string) => {
			if (forwardIPList.indexOf(ip) !== -1) {
				_.pull(forwardIPList, ip)
			}
			forwardIPList = _.concat(forwardIPList, ip)
			if (bypassIPList.indexOf(ip) !== -1) {
				bypassIPList = [
					...bypassIPList
				]
				_.pull(bypassIPList, ip)
			}
			saveIPListSetting()
			await refreshIpsetWanFW()
		},
		removeForwardIP: async (ip: string) => {
			if (forwardIPList.indexOf(ip) === -1) {
				return
			}
			forwardIPList = [
				...forwardIPList
			]
			_.pull(forwardIPList, ip)
			saveIPListSetting()
			await refreshIpsetWanFW()
		},
		getBypassIPList: () => {
			return option.settingManager.getSetting().bypassIPList
		},
		addBypassIP: async (ip: string) => {
			if (bypassIPList.indexOf(ip) !== -1) {
				_.pull(bypassIPList, ip)
			}
			bypassIPList = _.concat(bypassIPList, ip)
			if (forwardIPList.indexOf(ip) !== -1) {
				forwardIPList = [
					...forwardIPList
				]
				_.pull(forwardIPList, ip)
			}
			saveIPListSetting()
			await refreshIpsetWanAC()
		},
		removeBypassIP: async (ip: string) => {
			if (bypassIPList.indexOf(ip) === -1) {
				return
			}
			bypassIPList = [
				...bypassIPList
			]
			_.pull(bypassIPList, ip)
			saveIPListSetting()
			await refreshIpsetWanAC()
		},
		getForwardClientIPList: () => {
			return option.settingManager.getSetting().forwardClientIPList
		},
		addForwardClientIP: async (ip: string) => {
			if (forwardClientIPList.indexOf(ip) !== -1) {
				_.pull(forwardClientIPList, ip)
			}
			forwardClientIPList = _.concat(forwardClientIPList, ip)
			if (bypassClientIPList.indexOf(ip) !== -1) {
				bypassClientIPList = [
					...bypassClientIPList
				]
				_.pull(bypassClientIPList, ip)
			}
			saveClientIPListSetting()
			await refreshIpsetLanFW()
		},
		removeForwardClientIP: async (ip: string) => {
			if (forwardClientIPList.indexOf(ip) === -1) {
				return
			}
			forwardClientIPList = [
				...forwardClientIPList
			]
			_.pull(forwardClientIPList, ip)
			saveClientIPListSetting()
			await refreshIpsetLanFW()
		},
		getBypassClientIPList: () => {
			return option.settingManager.getSetting().bypassClientIPList
		},
		addBypassClientIP: async (ip: string) => {
			if (bypassClientIPList.indexOf(ip) !== -1) {
				_.pull(bypassClientIPList, ip)
			}
			bypassClientIPList = _.concat(bypassClientIPList, ip)
			if (forwardClientIPList.indexOf(ip) !== -1) {
				forwardClientIPList = [
					...forwardClientIPList
				]
				_.pull(forwardClientIPList, ip)
			}
			saveClientIPListSetting()
			await refreshIpsetLanAC()
		},
		removeBypassClientIP: async (ip: string) => {
			if (bypassClientIPList.indexOf(ip) === -1) {
				return
			}
			bypassClientIPList = [
				...bypassClientIPList
			]
			_.pull(bypassClientIPList, ip)
			saveClientIPListSetting()
			await refreshIpsetLanAC()
		}
	}
}

async function execCommand(cmd: string): Promise<void> {
	await execAsync(cmd, {
		cwd: binDir,
		env: process.env,
		shell: '/bin/bash'
	})
}

async function execCommandWithInputContent(cmd: string, args: string[], lines: string[]): Promise<void> {
	await new Promise((resolve) => {
		const proc = spawn(cmd, args, {
			cwd: binDir,
			env: process.env,
			stdio: ['pipe', 'ignore', 'ignore']
		})
		proc.on('close', resolve)
		lines.map((line) => line + '\n').forEach((line) => {
			proc.stdin.write(line)
		})
		proc.stdin.write('\x04')
	})
}

async function execIpsetActions(actions: string[]): Promise<void> {
	await execCommandWithInputContent('ipset', ['-!', '-'], actions)
}

const internalBypassNetList = [
	'0.0.0.0/8',
	'10.0.0.0/8',
	'100.64.0.0/10',
	'127.0.0.0/8',
	'169.254.0.0/16',
	'172.16.0.0/12',
	'192.0.0.0/24',
	'192.0.2.0/24',
	'192.88.99.0/24',
	'192.168.0.0/16',
	'198.18.0.0/15',
	'198.51.100.0/24',
	'203.0.113.0/24',
	'224.0.0.0/4',
	'240.0.0.0/4',
	'255.255.255.255'
]
