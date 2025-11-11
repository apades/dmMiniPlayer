import packageJson from '../package.json' assert { type: 'json' }
import { getChangeLog, spawnWithoutLog } from './utils.mjs'

const version = packageJson.version

const url = 'https://github.com/apades/dmMiniPlayer/blob/main/docs/changeLog'

async function main() {
  const preVersion = (
    await spawnWithoutLog(
      'git',
      'tag --sort=-creatordate | head -n 2'.split(' '),
    )
  )
    .split('\n')[1]
    .trim()

  console.log(getChangeLog(version) || 'Small update')
  console.log(`[More](${url}.md#${version.replaceAll('.', '')})`)
  console.log('')
  console.log('### ---')
  console.log(getChangeLog(version, 'zh') || '小更新')
  console.log(`[More](${url}-zh.md#${version.replaceAll('.', '')})`)
  console.log('')
  console.log(
    `Full commits: [${preVersion}...v${version}](https://github.com/apades/dmMiniPlayer/compare/${preVersion}...v${version})`,
  )
}
main()
