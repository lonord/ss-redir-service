import { ConfigProps } from '../../util/config'
import { BaseService, BaseServiceOption } from '../base/base-service'
import createDeamonService from '../base/deamon-service'

export type SSTunnelService = BaseService

export default function createSSTunnelService(option: BaseServiceOption): SSTunnelService {
	const sup = createDeamonService({
		...option,
		command: 'ss-tunnel',
		args: getArgs(option.config)
	})
	return {
		...sup
	} as SSTunnelService
}

function getArgs(config: ConfigProps): string[] {
	return [
		'-s',
		config.serverHost + '',
		'-p',
		config.serverPort + '',
		'-l',
		config.dnsTunPort + '',
		'-k',
		config.secret,
		'-m',
		config.encryptMethod,
		'-t',
		'60',
		'-b',
		'0.0.0.0',
		'-L',
		'8.8.8.8:53',
		'-u'
	]
}
