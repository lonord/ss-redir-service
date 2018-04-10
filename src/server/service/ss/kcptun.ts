import * as _ from 'lodash'
import { ConfigProps } from '../../util/config'
import { BaseServiceOption } from '../base/base-service'
import createDeamonService, { DeamonService } from '../base/deamon-service'

export type KcpTunService = DeamonService

export default function createKcpTunService(option: BaseServiceOption): KcpTunService {
	const sup = createDeamonService({
		...option,
		command: 'kcp-client',
		args: getArgs(option.config)
	})
	return {
		...sup
	} as KcpTunService
}

function getArgs(config: ConfigProps): string[] {
	let args = [
		'-r',
		config.kcpTunRemote,
		'-l',
		`:${config.kcpTunLocalPort}`
	]
	if (config.kcpTunArgs) {
		args = _.concat(args, config.kcpTunArgs.split(' ').filter((p) => !!p))
	}
	return args
}
