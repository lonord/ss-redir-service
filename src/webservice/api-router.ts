import * as Router from 'koa-router'
import * as Stream from 'stream'
import { ServiceController } from '../types'

export default function createAPIRouter(controller: ServiceController): Router {
	return new Router()
		.use(async (ctx, next) => {
			try {
				await next()
				const body = ctx.body
				if (body instanceof Stream) {
					return
				}
				if (typeof body === 'string' || typeof body === 'object') {
					ctx.body = {
						status: ctx.status,
						data: body
					}
				}
			} catch (e) {
				const status = e.status || 500
				const msg = e.message || 'Error'
				ctx.body = {
					status,
					msg
				}
			}
		})
		.put('/action/start', async (ctx) => {
			await controller.start()
			ctx.body = 'OK'
		})
		.put('/action/stop', async (ctx) => {
			await controller.stop()
			ctx.body = 'OK'
		})
		.get('/status', async (ctx) => {
			ctx.body = await controller.getStatus()
		})
		.get('/ssmode', async (ctx) => {
			ctx.body = await controller.getSSMode()
		})
		.post('/ssmode', async (ctx) => {
			const mode = ctx.request.body.mode
			if (['auto', 'global'].indexOf(mode) === -1) {
				ctx.throw(400, '`ssmode` is invalid, require `auto` or `global`')
			}
			await controller.setSSMode(mode)
			ctx.body = 'OK'
		})
		.get('/iplist/forward', async (ctx) => {
			ctx.body = await controller.getForwardIPList()
		})
		.put('/iplist/forward/:ip', async (ctx) => {
			await controller.addForwardIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.del('/iplist/forward/:ip', async (ctx) => {
			await controller.removeForwardIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.get('/iplist/bypass', async (ctx) => {
			ctx.body = await controller.getBypassIPList()
		})
		.put('/iplist/bypass/:ip', async (ctx) => {
			await controller.addBypassIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.del('/iplist/bypass/:ip', async (ctx) => {
			await controller.removeBypassIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.get('/clientiplist/forward', async (ctx) => {
			ctx.body = await controller.getForwardClientIPList()
		})
		.put('/clientiplist/forward/:ip', async (ctx) => {
			await controller.addForwardClientIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.del('/clientiplist/forward/:ip', async (ctx) => {
			await controller.removeForwardClientIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.get('/clientiplist/bypass', async (ctx) => {
			ctx.body = await controller.getBypassClientIPList()
		})
		.put('/clientiplist/bypass/:ip', async (ctx) => {
			await controller.addBypassClientIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.del('/clientiplist/bypass/:ip', async (ctx) => {
			await controller.removeBypassClientIP(ctx.params.ip)
			ctx.body = 'OK'
		})
		.get('/gfwlist/user', async (ctx) => {
			ctx.body = await controller.getUserGFWList()
		})
		.put('/gfwlist/user/:domain', async (ctx) => {
			await controller.addUserGFWDomain(ctx.params.domain)
			ctx.body = 'OK'
		})
		.del('/gfwlist/user/:domain', async (ctx) => {
			await controller.removeUserGFWDomain(ctx.params.domain)
			ctx.body = 'OK'
		})
		.put('/action/gfwlist/validate', async (ctx) => {
			await controller.validateGFWList()
			ctx.body = 'OK'
		})
		.put('/action/gfwlist/invalidate', async (ctx) => {
			await controller.invalidateGFWList()
			ctx.body = 'OK'
		})
		.put('/action/gfwlist/update', async (ctx) => {
			await controller.updateStandardGFWList()
			ctx.body = 'OK'
		})
		.get('/version', async (ctx) => {
			ctx.body = await controller.getVersion()
		})
		.all('/*', async (ctx) => {
			ctx.throw(404, 'API Not Found')
		})
}
