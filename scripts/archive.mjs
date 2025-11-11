import fs from 'fs-extra'
import archiver from 'archiver'
import packageData from '../package.json' with { type: 'json' }
import { pr, spawn } from './utils.mjs'

const args = process.argv.slice(2)
const isSizeTest = args[0] === '--size-test'

const version = packageData.version
const getBuildName = (ver) => `chrome-mv3-prod-${ver}.zip`
const getSizeTestName = (ver) => `size-test-${ver}.zip`
const codeBuildOutDir = pr('../dist')
const zipOutDir = pr('../build')

if (!fs.existsSync(zipOutDir)) {
  fs.mkdirSync(zipOutDir)
}

const getName = () => {
  if (!isSizeTest) return getBuildName(version)
  let count = 0
  while (true) {
    const fileName = getSizeTestName(count)
    if (fs.existsSync(pr(zipOutDir, fileName))) {
      count++
      continue
    }
    return fileName
  }
}

async function main() {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })
  archive.pipe(fs.createWriteStream(pr(zipOutDir, getName())))
  archive.directory(codeBuildOutDir, false)
  await archive.finalize()
  if (!isSizeTest) {
    await spawn('rm', [pr(zipOutDir, getSizeTestName('*')), '-f'])
  }
}

main()
