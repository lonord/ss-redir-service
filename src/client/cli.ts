#!/usr/bin/env node

import * as UI from 'readline-ui'
import createClient from './index'
import createPromptUI from './prompt'

const p = createPromptUI({
	functions: [
		{
			name: 'start',
			args: [],
			handle: async () => {
				await new Promise((resolve) => setTimeout(() => {
					console.log('OK')
					resolve()
				}, 3000))
			}
		},
		{
			name: 'stop',
			args: [],
			handle: async () => {
				//
			}
		},
		{
			name: 'getStatus',
			args: [],
			handle: async () => {
				//
			}
		},
		{
			name: 'getSSMode',
			args: [],
			handle: async () => {
				//
			}
		},
		{
			name: 'setSSMode',
			args: [ 'mode' ],
			handle: async (mode) => {
				//
			}
		},
		{
			name: 'getUserGFWList',
			args: [],
			handle: async () => {
				//
			}
		},
		{
			name: 'addUserGFWDomain',
			args: [ 'domain' ],
			handle: async (domain) => {
				//
			}
		},
		{
			name: 'removeUserGFWDomain',
			args: [ 'domain' ],
			handle: async (domain) => {
				//
			}
		},
		{
			name: 'updateStandardGFWList',
			args: [],
			handle: async () => {
				//
			}
		},
		{
			name: 'validateGFWList',
			args: [],
			handle: async () => {
				//
			}
		},
		{
			name: 'invalidateGFWList',
			args: [],
			handle: async () => {
				//
			}
		}
	],
	onExit: async () => {
		//
	}
})
