import { createServer } from 'http'
import * as kcors from 'kcors'
import * as Koa from 'koa'
import * as bodyparser from 'koa-bodyparser'
import * as json from 'koa-json'
import * as Router from 'koa-router'
import { ServiceController } from '../types'
import createAPIRouter from './api-router'

export interface WebServiceInstance {
	start(port: number, hostname?: string): Promise<void>
	stop(): Promise<void>
}

export default function createWebService(controller: ServiceController): WebServiceInstance {
	const app = new Koa()
	app.use(kcors())
	app.use(bodyparser())
	app.use(json())

	const rootRouter = new Router()
	const apiRouter = createAPIRouter(controller)
	rootRouter.use('/api', apiRouter.routes(), apiRouter.allowedMethods())
	app.use(rootRouter.routes())
	app.use(rootRouter.allowedMethods())

	const httpServer = createServer(app.callback())
	return {
		start: async (port: number, hostname?: string) => {
			await new Promise((resolve) => {
				httpServer.listen(port, hostname, resolve)
			})
		},
		stop: async () => {
			await new Promise((resolve) => {
				httpServer.close(resolve)
			})
		}
	}
}
