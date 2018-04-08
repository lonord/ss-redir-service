#!/usr/bin/env node

import * as isRoot from 'is-root'
import * as ms from 'ms'
import * as UI from 'readline-ui'
import createClient from './index'
import createPromptUI, { errorMsg, infoMsg } from './prompt'

// tslint:disable-next-line:no-var-requires
const pkg = require('../../package.json')

if (!isRoot()) {
	console.log('> ss-cli require root permission')
	process.exit(1)
}

console.log(`ss-redir-service v${pkg.version}`)
const client = createClient()
const p = createPromptUI({
	functions: [
		{
			name: 'start',
			args: [],
			handle: async () => {
				await client.start()
				console.log('OK')
			}
		},
		{
			name: 'stop',
			args: [],
			handle: async () => {
				await client.stop()
				console.log('OK')
			}
		},
		{
			name: 'getStatus',
			args: [],
			handle: async () => {
				const status = await client.getStatus()
				console.log(`* ss service is ${status.running ? infoMsg('running') : errorMsg('not running')}`)
				if (status.running) {
					console.log(`* ss running up to ${infoMsg(ms(status.uptime))}`)
				}
			}
		},
		{
			name: 'getSSMode',
			args: [],
			handle: async () => {
				const mode = await client.getSSMode()
				console.log(`ss mode is ${infoMsg(mode)}`)
			}
		},
		{
			name: 'setSSMode',
			args: [ 'mode' ],
			handle: async (mode) => {
				if (mode === 'auto' || mode === 'global') {
					await client.setSSMode(mode)
					console.log('OK')
				} else {
					throw new Error('ss mode should be `auto` or `global`')
				}
			}
		},
		{
			name: 'getUserGFWList',
			args: [],
			handle: async () => {
				const gfwlist = await client.getUserGFWList()
				gfwlist.forEach((t) => console.log(t))
			}
		},
		{
			name: 'addUserGFWDomain',
			args: [ 'domain' ],
			handle: async (domain) => {
				await client.addUserGFWDomain(domain)
				await client.validateGFWList()
				console.log('OK')
			}
		},
		{
			name: 'removeUserGFWDomain',
			args: [ 'domain' ],
			handle: async (domain) => {
				await client.removeUserGFWDomain(domain)
				await client.validateGFWList()
				console.log('OK')
			}
		},
		{
			name: 'updateStandardGFWList',
			args: [],
			handle: async () => {
				await client.updateStandardGFWList()
				await client.validateGFWList()
				console.log('OK')
			}
		},
		{
			name: 'validateGFWList',
			args: [],
			handle: async () => {
				await client.validateGFWList()
				console.log('OK')
			}
		},
		{
			name: 'invalidateGFWList',
			args: [],
			handle: async () => {
				await client.invalidateGFWList()
				console.log('OK')
			}
		}
	]
})
