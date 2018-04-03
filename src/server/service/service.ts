import { BaseServiceOption } from './base/base-service'
import createDnsmasqService, { DnsmasqService } from './dnsmasq/dnsmasq'
import createSSService, { SSService } from './ss/ss'

export type Service = DnsmasqService & SSService

export default function createService(option: BaseServiceOption): Service {
	const ss = createSSService(option)
	const dnsmasq = createDnsmasqService(option)
	return {
		...dnsmasq,
		...ss
	}
}
