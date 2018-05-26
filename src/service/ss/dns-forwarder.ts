import { ConfigProps } from '../../util/config'
import { BaseServiceOption } from '../base/base-service'
import createDeamonService, { DeamonService } from '../base/deamon-service'

export type DNSForwarderService = DeamonService

export default function createDNSForwarderService(option: BaseServiceOption): DNSForwarderService {
	const args = getArgs(option.config)
	const sup = createDeamonService({
		...option,
		command: 'hev-dns-forwarder',
		args
	})
	return {
		...sup
	} as DNSForwarderService
}

function getArgs(config: ConfigProps): string[] {
	return [
		'-p',
		config.dnsTunPort + '',
		'-s',
		'127.0.0.1:' + (config.dnsTunPort - 1)
	]
}
