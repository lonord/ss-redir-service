const { execSync } = require('child_process')
const { copyFileSync, readdirSync } = require('fs')
const mkdirp = require('mkdirp')
const { platform, tmpdir, arch } = require('os')
const { join } = require('path')
const rimraf = require('rimraf')
const constant = require('../universal/constant')

const tmp = join(tmpdir(), 'ss-redir-service-tmp')
const osType = platform()
const cpuArch = arch()

prepareConfig()
if (osType === 'linux') {
	// TODO 检查重复编译
	console.log('> Installing shadowsocks-libev')
	rimraf.sync(tmp)
	mkdirp.sync(tmp)
	execSync(`tar zxf ${findSSPackage()} -C ${tmp}`)
	const exractDir = findSSExtractDir()
	execSync('./configure --disable-documentation', {
		cwd: exractDir,
		stdio: 'inherit'
	})
	execSync('make', {
		cwd: exractDir,
		stdio: 'inherit'
	})
	copySSBinary(exractDir)
	rimraf.sync(tmp)
	console.log('> Installed shadowsocks-libev successfully')
} else {
	console.log(`> Current os ${osType} do not support running server, client only`)
}

function findSSPackage() {
	const dir = join(__dirname, '../assets')
	const files = readdirSync(dir)
	for (const f of files) {
		if (f.match(/^shadowsocks-libev(.*).tar.gz$/)) {
			return join(dir, f)
		}
	}
	throw new Error('Could not find shadowsocks-libev-{version}.tar.gz in assets')
}

function findSSExtractDir() {
	const files = readdirSync(tmp)
	for (const f of files) {
		if (f.match(/^shadowsocks-libev/)) {
			return join(tmp, f)
		}
	}
	throw new Error('Could not find extracted shadowsocks-libev in temp directory')
}

function copySSBinary(exractDir) {
	const ssNAT = join(exractDir, 'src/ss-nat')
	const ssRedir = join(exractDir, 'src/ss-redir')
	const ssTunnel = join(exractDir, 'src/ss-tunnel')
	const targetDir = getBinaryDir()
	copyFileSync(ssNAT, join(targetDir, 'ss-nat'))
	copyFileSync(ssRedir, join(targetDir, 'ss-redir'))
	copyFileSync(ssTunnel, join(targetDir, 'ss-tunnel'))
}

function getBinaryDir() {
	if (osType === 'linux') {
		return join(__dirname, '../assets/bin', cpuArch)
	}
}

function prepareConfig() {
	if (!existsSync(constant.configFile)) {
		copyFileSync(join(__dirname, '../../../../assets/config/default-config.yml'), constant.configFile)
	}
}
