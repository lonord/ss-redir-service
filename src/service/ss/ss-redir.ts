import { ConfigProps } from '../../util/config'
import { BaseServiceOption } from '../base/base-service'
import createDeamonService, { DeamonService } from '../base/deamon-service'

export type SSRedirService = DeamonService

export default function createSSRedirService(option: BaseServiceOption): SSRedirService {
	const args = getArgs(option.config)
	if (option.verbose === true) {
		args.push('-v')
	}
	const sup = createDeamonService({
		...option,
		command: 'ss-redir',
		args
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
