import { exec, execSync } from 'child_process'
import { writeFile } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import { SSMode, SSNatMethods } from '../../../types'
import { binDir } from '../../util/util'
import createBaseService, { BaseService, BaseServiceOption } from '../base/base-service'

const execAsync = promisify(exec)
const writeFileAsync = promisify(writeFile)

export type SSNatService = BaseService & SSNatMethods

export default function createSSNatService(option: BaseServiceOption): SSNatService {
	const c = option.config
	const sup = createBaseService(option)

	let ssMode: SSMode = option.settingManager.getSetting().ssMode

	async function setNatRules() {
		await unsetNatRules()
		const bypassFile = await writeBypassListFile(c.excludeIPList)
		const cmd = ssMode === 'auto'
			? `ss-nat -s ${c.serverHost} -l ${c.localPort} -i ${bypassFile} -e match-set ${c.gfwIpsetName} dst -o`
			: `ss-nat -s ${c.serverHost} -l ${c.localPort} -i ${bypassFile} -o`
		await execAsync(cmd, {
			cwd: binDir,
			env: process.env
		})
	}

	async function unsetNatRules() {
		await execAsync('ss-nat -f', {
			cwd: binDir,
			env: process.env
		})
	}

	return {
		...sup,
		start: () => {
			if (sup.isRunning()) {
				return
			}
			setNatRules().catch((err) => console.error('set nat rules error: ', err))
			sup.start()
		},
		stop: () => {
			sup.stop()
			unsetNatRules().catch((err) => console.error('unset nat rules error: ', err))
		},
		getSSMode: () => {
			return ssMode
		},
		setSSMode: (mode) => {
			ssMode = mode
			if (sup.isRunning()) {
				setNatRules().catch((err) => console.error('update ss mode error: ', err))
			}
			option.settingManager.updateSetting({
				ssMode
			})
		}
	}
}

async function writeBypassListFile(bypassList: string[]): Promise<string> {
	const filePath = join(tmpdir(), 'ss-redir-service-bypass-ip.txt')
	await writeFileAsync(filePath, bypassList.join('\n'), 'utf8')
	return filePath
}
