const path = require('path')
const os = require('os')

const osType = os.platform()
const cpuArch = os.arch()

exports.configHome = path.join(os.homedir(), '.ss-redir-service')
exports.configFile = path.join(configHome, 'config.yml')
exports.sockFile = '/var/run/ss-redir-service.sock'
exports.binDir = join(__dirname, '../assets/bin', cpuArch)