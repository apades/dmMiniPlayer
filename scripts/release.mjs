import enquirer from 'enquirer'
import packageData from '../package.json' assert { type: 'json' }
import fs from 'fs-extra'
import { spawn, pr } from './utils.mjs'
import archiver from 'archiver'

const version = packageData.version

const getBuildName = (ver) => `chrome-mv3-prod-${ver}.zip`
const codeBuildOutDir = pr('../dist')
const zipOutDir = pr('../build')

const verSplit = version.split('.')
let toVersion =
  verSplit.slice(0, verSplit.length - 1).join('.') +
  `.${+verSplit[verSplit.length - 1] + 1}`

enquirer
  .prompt([
    {
      type: 'input',
      name: 'version',
      message: `release version (now ${version})`,
      initial: toVersion,
    },
  ])
  .then(async (val) => {
    const version = val.version
    packageData.version = version
    await fs.writeJSON(pr('../package.json'), packageData, { spaces: 2 })
    await spawn('npm', ['run', 'build'])

    // 打包zip
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })
    archive.pipe(fs.createWriteStream(pr(zipOutDir, getBuildName(version))))
    archive.directory(codeBuildOutDir, false)

    await archive.finalize()

    // git
    await spawn('git', ['add', '.'])
    await spawn('git', ['commit', '-m', `"release: ${version}"`])
    await spawn('git', ['tag', `v${version}`])
    await spawn('git', ['push'])
    await spawn('git', ['push', '--tags'])
  })
