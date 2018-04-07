#!/usr/bin/env node

import * as UI from 'readline-ui'
import createClient from './index'
import createPromptUI, { infoMsg } from './prompt'

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
				console.log('OK [TODO status show]')
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
				console.log('OK')
			}
		},
		{
			name: 'removeUserGFWDomain',
			args: [ 'domain' ],
			handle: async (domain) => {
				await client.removeUserGFWDomain(domain)
				console.log('OK')
			}
		},
		{
			name: 'updateStandardGFWList',
			args: [],
			handle: async () => {
				await client.updateStandardGFWList()
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
