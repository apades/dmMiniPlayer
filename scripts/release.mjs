import enquirer from 'enquirer'
import packageData from '../package.json' assert { type: 'json' }
import fs from 'fs-extra'
import { spawn, pr } from './utils.mjs'

const version = packageData.manifest.version

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
    packageData.manifest.version = version
    await fs.writeJSON(pr('../package.json'), packageData, { spaces: 2 })
    await spawn('npm', ['run', 'build'])
    // git
    await spawn('git', ['add', '.'])
    await spawn('git', ['commit', '-m', `release: ${version}`])
    await spawn('git', ['tag', `v${version}`])
    await spawn('git', ['push'])
    await spawn('git', ['push', '--tags'])
  })
