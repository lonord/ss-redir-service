import * as _ from 'lodash'
import { ConfigProps } from '../../util/config'
import { BaseService, BaseServiceOption } from '../base/base-service'
import createDeamonService from '../base/deamon-service'

export type KcpTunService = BaseService

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
