import chalk, { Chalk, ColorSupport } from 'chalk'
import * as _ from 'lodash'
import * as UI from 'readline-ui'
import * as utils from 'readline-utils'

const fnComplete = chalk.grey
const fnCompleteArg = fnComplete.underline

export const errorMsg = chalk.redBright
export const infoMsg = chalk.greenBright

export interface PromptUIFunction {
	name: string
	args: string[]
	handle(...args: string[]): Promise<void>
}

export interface PromptUIOption {
	promptStr?: string
	functions: PromptUIFunction[]
	onExit?(): Promise<void | boolean>
}

export interface PromptUIInstance {
	exit()
}

export default function createPromptUI(option: PromptUIOption): PromptUIInstance {
	const promptStr = option.promptStr || '> '
	const fns = option.functions
	const ui = new UI()
	ui.render(promptStr)

	ui.on('keypress', (keyName: string) => {
		if (keyName === 'tab') {
			ui.rl.write(null, { name: 'backspace' })
			const str = ui.rl.line
			if (str.indexOf(' ') === -1) {
				const matchedFns = fns.filter((fn) => fn.name.startsWith(str))
				const rstr = dealWithInput(str, matchedFns)
				if (rstr.length > 0) {
					ui.rl.write(rstr.join(''))
				} else if (matchedFns.length > 0) {
					console.log('')
					matchedFns.forEach((fn) => {
						console.log(combineFunctionName(fn))
					})
				}
			}
		}
		// const mFns = fns.filter((fn) => combineFunctionNameRaw(fn).startsWith(ui.rl.line))
		// if (mFns.length === 1) {
		// 	const helperSuffix = dealWithHelperSuffix(ui.rl.line, mFns[0])
		// 	const pos = utils.cursorPosition(ui.rl)
		// 	ui.render(promptStr + helperSuffix)
		// 	ui.rl.output.unmute()
		// 	utils.restoreCursorPos(ui.rl, pos)
		// 	ui.rl.output.mute()
		// } else {
		ui.render(promptStr + ui.rl.line)
		// }
	})

	ui.on('line', (result: string) => {
		ui.render(promptStr + result)
		console.log('')
		if (result === '') {
			ui.render(promptStr)
			return
		}
		const nameAndArgs = result.trimRight().split(' ')
		const fnName = nameAndArgs[0]
		const fnArgs = nameAndArgs.slice(1)
		const fnIdx = _.findIndex(fns, { name: fnName })
		if (fnIdx === -1) {
			console.log(errorMsg(`Unknow function '${fnName}'`))
			ui.render(promptStr)
			return
		}
		const fn = fns[fnIdx]
		ui.pause()
		fn.handle.apply(null, fnArgs).catch((err) => {
			console.log(errorMsg(`Error calling function '${fnName}': ${err.message || err.toString()}`))
		}).then(() => {
			ui.resume()
			ui.render(promptStr)
		})
	})

	ui.rl.on('SIGINT', async () => {
		console.log('')
		if (option.onExit) {
			const r = await option.onExit()
			if (r === false) {
				return
			}
		}
		console.log(infoMsg('bye'))
		exit()
		process.exit(0)
	})

	const exit = () => {
		ui.end()
		ui.rl.pause()
	}

	return {
		exit
	}
}

function dealWithInput(input: string, fns: PromptUIFunction[]): string[] {
	const names = fns.map((fn) => fn.name)
	const chList: string[] = []
	let i = input.length
	while (true) {
		let ch = null
		for (const n of names) {
			if (n.length < i + 1) {
				ch = null
				break
			}
			const c = n[i]
			if (!ch) {
				ch = c
			} else {
				if (ch !== c) {
					ch = null
					break
				}
			}
		}
		if (ch) {
			chList.push(ch)
		} else {
			break
		}
		i++
	}
	return chList
}

function combineFunctionName(fn: PromptUIFunction): string {
	return fnComplete(fn.name) + ' ' + fn.args.map((a) => fnCompleteArg(a)).join(' ')
}

function combineFunctionNameRaw(fn: PromptUIFunction): string {
	return [
		fn.name,
		...fn.args
	].join(' ')
}

function dealWithHelperSuffix(input: string, fn: PromptUIFunction): string {
	let suffix = ''
	if (input.indexOf(' ') !== -1) {
		let argIdx = -1
		let s = input
		do {
			s = s.substr(s.indexOf(' ') + 1)
			argIdx++
		} while (s.indexOf(' ') !== -1)
		suffix = fnCompleteArg(fn.args[argIdx].substr(s.length))
		const subArgs = fn.args.slice(argIdx + 1)
		if (subArgs.length > 0) {
			suffix += ' ' + subArgs.map((a) => fnCompleteArg(a)).join(' ')
		}
	} else {
		const argsStr = fn.args.length > 0
			? ' ' + fn.args.map((a) => fnCompleteArg(a)).join(' ')
			: ''
		suffix = fnComplete(fn.name.substr(input.length)) + argsStr
	}
	return input + suffix
}
