const path = require('path')
const os = require('os')

const osType = os.platform()
const cpuArch = os.arch()
const configHome = path.join(os.homedir(), '.ss-redir-service')

exports.configHome = configHome
exports.configFile = path.join(configHome, 'config.yml')
exports.sockFile = '/var/run/ss-redir-service.sock'
exports.binDir = path.join(__dirname, '../assets/bin', cpuArch)