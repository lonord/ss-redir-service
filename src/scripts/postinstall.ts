import { execSync } from 'child_process'
import { copyFileSync, readdirSync } from 'fs'
import * as mkdirp from 'mkdirp'
import { platform, tmpdir } from 'os'
import { join } from 'path'
import * as rimraf from 'rimraf'
import { getBinaryDir } from '../server/util/util'

const tmp = join(tmpdir(), 'ss-redir-service-tmp')
const osType = platform()

if (osType === 'linux') {
	console.log('> Installing shadowsocks-libev')
	mkdirp.sync(tmp)
	execSync(`tar zxf ${findSSPackage()} -C ${tmp}`)
	const exractDir = findSSExtractDir()
	execSync('./configure', {
		cwd: exractDir
	})
	execSync('make', {
		cwd: exractDir
	})
	copySSBinary(exractDir)
	rimraf.sync(tmp)
} else {
	console.log(`> Current os ${osType} do not support running server, client only`)
}

function findSSPackage(): string {
	const dir = join(__dirname, '../../assets')
	const files = readdirSync(dir)
	for (const f of files) {
		if (f.match(/^shadowsocks-libev(.*).tar.gz$/)) {
			return join(dir, f)
		}
	}
	throw new Error('Could not find shadowsocks-libev-{version}.tar.gz in assets')
}

function findSSExtractDir(): string {
	const files = readdirSync(tmp)
	for (const f of files) {
		if (f.match(/^shadowsocks-libev/)) {
			return join(tmp, f)
		}
	}
	throw new Error('Could not find extracted shadowsocks-libev in temp directory')
}

function copySSBinary(exractDir: string) {
	const ssNAT = join(exractDir, 'src/ss-nat')
	const ssRedir = join(exractDir, 'src/ss-redir')
	const ssTunnel = join(exractDir, 'src/ss-tunnel')
	const targetDir = getBinaryDir()
	copyFileSync(ssNAT, join(targetDir, 'ss-nat'))
	copyFileSync(ssRedir, join(targetDir, 'ss-redir'))
	copyFileSync(ssTunnel, join(targetDir, 'ss-tunnel'))
}
