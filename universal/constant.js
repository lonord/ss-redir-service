const path = require('path')
const os = require('os')

const configHome = path.join(os.homedir(), '.ss-redir-service')

exports.configHome = configHome
exports.configFile = path.join(configHome, 'config.yml')