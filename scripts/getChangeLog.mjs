import { getChangeLog } from './utils.mjs'
import packageJson from '../package.json' assert { type: 'json' }

const version = packageJson.version

const url = 'https://github.com/apades/dmMiniPlayer/blob/main/docs/changeLog'

console.log(getChangeLog(version) || 'Small update')
console.log(`[More](${url}.md#${version.replaceAll('.', '')})`)
console.log('')
console.log('### ---')
console.log(getChangeLog(version, 'zh') || '小更新')
console.log(`[More](${url}-zh.md#${version.replaceAll('.', '')})`)
