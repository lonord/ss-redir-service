import { copyFileSync, existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import * as YAML from 'yamljs'

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

export interface ConfigManager {
	getConfig(): ConfigProps
}

export default function createConfigManager(): ConfigManager {
	const configHome = join(homedir(), '.ss-redir-service')
	const configFile = join(configHome, 'config.yml')

	prepareConfig(configFile)
	const config = readConfig(configFile)

	return {
		getConfig: () => config
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
