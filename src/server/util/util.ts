import { arch, platform } from 'os'
import { join } from 'path'

const cpuArch = arch()
const osType = platform()

export function getBinaryDir(): string {
	if (osType === 'linux') {
		return join(__dirname, '../../../assets/bin', cpuArch)
	}
}
