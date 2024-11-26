import { getChangeLog } from './utils.mjs'
import packageJson from '../package.json'

const version = packageJson.version

const url = 'https://github.com/apades/dmMiniPlayer/blob/main/docs/changeLog'

console.log(getChangeLog(version))
console.log(`[Link](${url}.md#${version.replaceAll('.', '')})`)
console.log('---------')
console.log(getChangeLog(version, 'zh'))
console.log(`[Link](${url}-zh.md#${version.replaceAll('.', '')})`)
