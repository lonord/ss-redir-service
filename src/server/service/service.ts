import { BaseServiceOption } from './base/base-service'
import createDnsmasqService, { DnsmasqService } from './dnsmasq/dnsmasq'
import createSSService, { SSService } from './ss/ss'

export type Service = DnsmasqService & SSService

export default function createService(option: BaseServiceOption): Service {
	const ss = createSSService(option)
	const dnsmasq = createDnsmasqService(option)
	return {
		...dnsmasq,
		...ss,
		start: async () => {
			await ss.start()
			await dnsmasq.validateGFWList()
		},
		stop: async () => {
			await dnsmasq.invalidateGFWList()
			await ss.stop()
		}
	}
}
