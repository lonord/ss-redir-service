import { copyFileSync, existsSync, readFileSync, writeFile } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import * as YAML from 'yamljs'
import { SSMode } from '../../types'

export interface OptionalConfigProps {
	excludeIPList?: string[]
	gfwIpsetName?: string
	dnsTunPort?: number
	dnsmasqConfigDir?: string
	dnsmasqReloadCommand?: string
	enableKcpTun?: boolean
	kcpTunRemote?: string
	kcpTunLocalPort?: string
	kcpTunArgs?: string
}

export interface ConfigProps extends OptionalConfigProps {
	serverHost: string
	serverPort: number
	localPort: number
	secret: string
	encryptMethod: string
}

export interface SettingProps {
	ssEnable: boolean
	ssMode: SSMode
	userGFWList: string[]
}

export interface SettingManager {
	getSetting(): SettingProps
	updateSetting<K extends keyof SettingProps>(setting: Pick<SettingProps, K>)
}

export interface ConfigManager {
	getConfig(): ConfigProps
	getSettingManager(): SettingManager
}

export default function createConfigManager(configHome?: string): ConfigManager {
	configHome = configHome || join(homedir(), '.ss-redir-service')
	const configFile = join(configHome, 'config.yml')
	const settingFile = join(configHome, 'setting.json')

	prepareConfig(configFile)
	const config = readConfig(configFile)
	const settingManager = createSettingManager(settingFile)

	return {
		getConfig: () => config,
		getSettingManager: () => settingManager
	}
}

function prepareConfig(configFile: string) {
	if (!existsSync(configFile)) {
		copyFileSync(join(__dirname, '../../../../assets/config/default-config.yml'), configFile)
	}
}

function readConfig(configFile: string): ConfigProps {
	const configObj = (YAML.parse(readFileSync(configFile, 'utf8')) || {}) as ConfigProps
	return {
		...getDefaultConfig(),
		...configObj
	}
}

function getDefaultConfig(): OptionalConfigProps {
	return {
		excludeIPList: [],
		gfwIpsetName: 'gfwlist',
		dnsTunPort: 30053,
		dnsmasqConfigDir: '/etc/dnsmasq.d',
		dnsmasqReloadCommand: 'service dnsmasq restart',
		enableKcpTun: false
	}
}

function createSettingManager(settingFile: string): SettingManager {

	const defaultSetting: SettingProps = {
		ssEnable: true,
		ssMode: 'auto',
		userGFWList: []
	}

	let setting: SettingProps = null

	if (!existsSync(settingFile)) {
		writeSetting(defaultSetting)
		setting = {
			...defaultSetting
		}
	} else {
		const s = JSON.parse(readFileSync(settingFile, 'utf8'))
		setting = {
			...defaultSetting,
			...s
		}
	}

	function writeSetting(s: SettingProps) {
		writeFile(settingFile, JSON.stringify(s), (err) => {
			if (err) {
				console.error('save setting error: ', err)
			}
		})
	}

	return {
		getSetting: () => {
			return setting
		},
		updateSetting: (s) => {
			setting = {
				...setting,
				...(s as any)
			}
			writeSetting(setting)
		}
	}
}
