import withProcessStatus from '../../decorator/process-status'
import { ProcessStat } from '../../types'
import createBaseService, { BaseService, BaseServiceOption } from '../base/base-service'
import createDNSForwarderService from './dns-forwarder'
import createKcpTunService from './kcptun'
import createSSNatService, { SSNatService } from './ss-nat'
import createSSRedirService from './ss-redir'
import createSSTunnelService from './ss-tunnel'

export interface SSService extends BaseService, SSNatService {
	getStatus(): Promise<{[name: string]: ProcessStat}>
}

export default function createSSService(option: BaseServiceOption): SSService {
	const sup = createBaseService(option)
	const nat = createSSNatService(option)
	const redir = withProcessStatus(createSSRedirService(option))
	const tunnel = withProcessStatus(createSSTunnelService(option))
	const dnsForwarder = withProcessStatus(createDNSForwarderService(option))
	const kcptun = option.config.enableKcpTun ? withProcessStatus(createKcpTunService(option)) : null
	return {
		...sup,
		...nat,
		isRunning: () => sup.isRunning(),
		start: async () => {
			await sup.start()
			kcptun && await kcptun.start()
			await redir.start()
			await tunnel.start()
			await dnsForwarder.start()
			await nat.start()
		},
		stop: async () => {
			await nat.stop()
			await dnsForwarder.stop()
			await tunnel.stop()
			await redir.stop()
			kcptun && await kcptun.stop()
			await sup.stop()
		},
		getStatus: async () => {
			const pList: Array<Promise<{ [name: string]: ProcessStat }>> = [
				getProcessStatus('ss-redir', redir.getProcessStatus()),
				getProcessStatus('ss-tunnel', tunnel.getProcessStatus()),
				getProcessStatus('dns-forwarder', dnsForwarder.getProcessStatus())
			]
			if (kcptun) {
				pList.push(getProcessStatus('kcptun', kcptun.getProcessStatus()))
			}
			const resultList = await Promise.all(pList)
			return resultList.reduce((p, c) => ({ ...p, ...c }))
		}
	}
}

async function getProcessStatus(name: string, p: Promise<ProcessStat>) {
	const s = await p
	return {
		[name]: s
	}
}
