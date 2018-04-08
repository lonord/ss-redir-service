import { BaseServiceOption } from './base/base-service'
import createDnsmasqService, { DnsmasqService } from './dnsmasq/dnsmasq'
import createIpsetService from './dnsmasq/ipset'
import createSSService, { SSService } from './ss/ss'

export type Service = DnsmasqService & SSService

export default function createService(option: BaseServiceOption): Service {
	const ss = createSSService(option)
	const dnsmasq = createDnsmasqService(option)
	const ipset = createIpsetService(option)
	return {
		...dnsmasq,
		...ipset,
		...ss,
		start: async () => {
			await ipset.start()
			await ss.start()
			await dnsmasq.validateGFWList()
		},
		stop: async () => {
			await dnsmasq.invalidateGFWList()
			await ss.stop()
			await ipset.stop()
		}
	}
}
