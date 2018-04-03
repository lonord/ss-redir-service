import { arch, platform } from 'os'
import { join } from 'path'

const osType = platform()
const cpuArch = arch()

export const binDir = join(__dirname, '../../../../assets/bin', cpuArch)

export const sockFile = '/var/run/ss-redir-service.sock'
