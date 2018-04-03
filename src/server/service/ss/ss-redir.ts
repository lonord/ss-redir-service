import { ConfigProps } from '../../util/config'
import { BaseService, BaseServiceOption } from '../base/base-service'
import createDeamonService from '../base/deamon-service'

export type SSRedirService = BaseService

export default function createSSRedirService(option: BaseServiceOption): SSRedirService {
	const sup = createDeamonService({
		...option,
		command: 'ss-redir',
		args: getArgs(option.config)
	})
	return {
		...sup
	} as SSRedirService
}

function getArgs(config: ConfigProps): string[] {
	const serverAddr = config.enableKcpTun
		? '127.0.0.1'
		: config.serverHost
	const serverPort = config.enableKcpTun
		? config.kcpTunLocalPort + ''
		: config.serverPort + ''
	return [
		'-s',
		serverAddr,
		'-p',
		serverPort,
		'-l',
		config.localPort + '',
		'-k',
		config.secret,
		'-m',
		config.encryptMethod,
		'-t',
		'60',
		'-b',
		'0.0.0.0'
	]
}
