const { execSync } = require('child_process')
const { copyFileSync, readdirSync, existsSync, readFileSync, writeFileSync } = require('fs')
const mkdirp = require('mkdirp')
const { platform, tmpdir, arch } = require('os')
const { join } = require('path')
const rimraf = require('rimraf')
const hashFiles = require('hash-files')
const constant = require('../universal/constant')

const tmp = join(tmpdir(), 'ss-redir-service-tmp')
const osType = platform()
const cpuArch = arch()
const assertDir = join(__dirname, '../assets')
const hashFile = join(assertDir, 'binary.hash')
const ssPackageFile = findSSPackage()

prepareConfig()
if (osType === 'linux') {
	if (checkBinaryHashFile()) {
		console.log('> shadowsocks-libev is already installed')
		return
	}
	console.log('> Installing shadowsocks-libev')
	compileShadowskcks()
	createBinaryHashFile()
	console.log('> Installed shadowsocks-libev successfully')
} else {
	console.log(`> Current os ${osType} do not support running server, client only`)
}

function compileShadowskcks() {
	rimraf.sync(tmp)
	mkdirp.sync(tmp)
	execSync(`tar zxf ${ssPackageFile} -C ${tmp}`)
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
}

function createBinaryHashFile() {
	const hashFileContent = {
		ssNAT: calculateFileHash(join(constant.binDir, 'ss-nat')),
		ssRedir: calculateFileHash(join(constant.binDir, 'ss-redir')),
		ssTunnel: calculateFileHash(join(constant.binDir, 'ss-tunnel')),
		tar: calculateFileHash(ssPackageFile)
	}
	writeFileSync(hashFile, JSON.stringify(hashFileContent), 'utf8')
}

function checkBinaryHashFile() {
	if (!existsSync(hashFile)) {
		return false
	}
	let hashFileContent = null
	try {
		hashFileContent = JSON.parse(readFileSync(hashFile, 'utf8'))
	} catch (err) {
		return false
	}
	if (!hashFileContent.ssNAT || !hashFileContent.ssRedir || !hashFileContent.ssTunnel || !hashFileContent.tar) {
		return false
	}
	if (hashFileContent.tar !== calculateFileHash(ssPackageFile)) {
		return false
	}
	if (hashFileContent.ssNAT !== calculateFileHash(join(constant.binDir, 'ss-nat'))) {
		return false
	}
	if (hashFileContent.ssRedir !== calculateFileHash(join(constant.binDir, 'ss-redir'))) {
		return false
	}
	if (hashFileContent.ssTunnel !== calculateFileHash(join(constant.binDir, 'ss-tunnel'))) {
		return false
	}
	return true
}

function calculateFileHash(filePath) {
	if (!existsSync(filePath)) {
		return '-'
	}
	return hashFiles.sync({
		files: [filePath],
		algorithm: 'sha256'
	})
}

function findSSPackage() {
	const dir = assertDir
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
	const targetDir = constant.binDir
	copyFileSync(ssNAT, join(targetDir, 'ss-nat'))
	copyFileSync(ssRedir, join(targetDir, 'ss-redir'))
	copyFileSync(ssTunnel, join(targetDir, 'ss-tunnel'))
}

function prepareConfig() {
	mkdirp.sync(constant.configHome)
	if (!existsSync(constant.configFile)) {
		copyFileSync(join(__dirname, '../assets/config/default-config.yml'), constant.configFile)
	}
}
