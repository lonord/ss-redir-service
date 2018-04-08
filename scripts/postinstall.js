const { copyFileSync, existsSync } = require('fs')
const mkdirp = require('mkdirp')
const { join } = require('path')
const constant = require('../universal/constant')

mkdirp.sync(constant.configHome)
if (!existsSync(constant.configFile)) {
	copyFileSync(join(__dirname, '../assets/config/default-config.yml'), constant.configFile)
}
