import { execSync } from 'child_process'
import { existsSync } from 'fs'
import * as _ from 'lodash'

const executables = {
	iptables: 'iptables',
	ipset: 'ipset',
	dnsmasq: 'dnsmasq'
}

export interface DependenceChecker {
	check()
}

export default function createDependenceChecker(): DependenceChecker {
	return {
		check: () => {
			const execMap = {
				...executables
			}
			for (const exec of _.values(execMap)) {
				if (exec.startsWith('/')) {
					if (!existsSync(exec)) {
						throw new Error(`Could not find ${exec}`)
					}
				}
				execSync(`${exec} --version`, {
					stdio: 'ignore'
				})
			}
		}
	}
}
