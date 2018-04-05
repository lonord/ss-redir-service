import createBaseService, { BaseService, BaseServiceOption } from '../base/base-service'
import createKcpTunService from './kcptun'
import createSSNatService, { SSNatService } from './ss-nat'
import createSSRedirService from './ss-redir'
import createSSTunnelService from './ss-tunnel'

export interface SSService extends BaseService, SSNatService {
	getStatus()
}

export default function createSSService(option: BaseServiceOption): SSService {
	const sup = createBaseService(option)
	const nat = createSSNatService(option)
	const redir = createSSRedirService(option)
	const tunnel = createSSTunnelService(option)
	const kcptun = option.config.enableKcpTun ? createKcpTunService(option) : null
	return {
		...sup,
		...nat,
		isRunning: () => sup.isRunning(),
		start: async () => {
			await sup.start()
			kcptun && await kcptun.start()
			await redir.start()
			await tunnel.start()
			await nat.start()
		},
		stop: async () => {
			await nat.stop()
			await tunnel.stop()
			await redir.stop()
			kcptun && await kcptun.stop()
			await sup.stop()
		},
		getStatus: () => {
			//
		}
	}
}
