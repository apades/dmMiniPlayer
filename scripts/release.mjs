import enquirer from 'enquirer'
import packageData from '../package.json' assert { type: 'json' }
import fs from 'fs-extra'
import { spawn, pr } from './utils.mjs'
import archiver from 'archiver'
import chalk from 'chalk'

const nowVersion = packageData.version

const getBuildName = (ver) => `chrome-mv3-prod-${ver}.zip`
const codeBuildOutDir = pr('../dist')
const zipOutDir = pr('../build')
if (!fs.existsSync(zipOutDir)) {
  fs.mkdirSync(zipOutDir)
}

const verSplit = nowVersion.split('.')
let toVersion =
  verSplit.slice(0, verSplit.length - 1).join('.') +
  `.${+verSplit[verSplit.length - 1] + 1}`

;(async () => {
  const { version } = await enquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: `release version (now ${nowVersion})`,
      initial: toVersion,
    },
  ])

  console.log(`修改changeLog文件 ${chalk.green('docs/changeLog-zh.md')}`)
  console.log(`修改changeLog文件 ${chalk.green('docs/changeLog.md')}`)
  // fs.openSync(pr('../docs/changeLog.md'), 'r')

  packageData.version = version
  await fs.writeJSON(pr('../package.json'), packageData, { spaces: 2 })
  const { confirm } = await enquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `build ${version} ?`,
      initial: true,
    },
  ])

  if (!confirm) return
  await spawn('npm', ['run', 'build'])

  // 打包zip
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })
  archive.pipe(fs.createWriteStream(pr(zipOutDir, getBuildName(version))))
  archive.directory(codeBuildOutDir, false)

  await archive.finalize()

  const { release } = await enquirer.prompt([
    {
      type: 'confirm',
      name: 'release',
      message: `release ${version} ?`,
      initial: true,
    },
  ])

  if (!release) return

  // git
  await spawn('git', ['add', '.'])
  await spawn('git', ['commit', '-m', `"release: ${version}"`])
  await spawn('git', ['tag', `v${version}`])
  await spawn('git', ['push'])
  await spawn('git', ['push', '--tags'])
})()
