import { exec } from 'child_process'
import { promisify } from 'util'
import createBaseService, { BaseService, BaseServiceOption } from '../base/base-service'

const execAsync = promisify(exec)

export type IpsetService = BaseService

export default function createIpsetService(option: BaseServiceOption): IpsetService {
	const sup = createBaseService(option)

	const createIpset = async () => {
		await removeIpset()
		try {
			await execAsync(`ipset create ${option.config.gfwIpsetName} hash:ip`)
		} catch (err) {
			// ignore
		}
	}

	const removeIpset = async () => {
		try {
			await execAsync(`ipset destroy ${option.config.gfwIpsetName}`)
		} catch (err) {
			// ignore
		}
	}

	return {
		...sup,
		start: async () => {
			if (sup.isRunning()) {
				return
			}
			await sup.start()
			await createIpset()
		},
		stop: async () => {
			await removeIpset()
			await sup.stop()
		}
	}
}
