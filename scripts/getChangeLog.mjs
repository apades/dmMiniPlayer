import { getChangeLog } from './utils.mjs'
import packageJson from '../package.json'

const version = packageJson.version

console.log(getChangeLog(version))
console.log('---------')
console.log(getChangeLog(version, 'zh'))
