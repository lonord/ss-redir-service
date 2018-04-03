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
		start: () => {
			kcptun && kcptun.start()
			redir.start()
			tunnel.start()
			nat.start()
			sup.start()
		},
		stop: () => {
			sup.stop()
			nat.stop()
			tunnel.stop()
			redir.stop()
			kcptun && kcptun.stop()
		},
		getStatus: () => {
			//
		}
	}
}
