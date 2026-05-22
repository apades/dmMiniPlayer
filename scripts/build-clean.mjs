import fs from 'fs-extra'
import path from 'path'
import { pr } from './utils.mjs'

const rootDir = pr('..')
const distDir = pr('../dist')
const relativeDist = path.relative(rootDir, distDir)

if (relativeDist.startsWith('..') || path.isAbsolute(relativeDist)) {
  throw new Error(`dist path escapes workspace: ${distDir}`)
}

fs.readdirSync(distDir)
  .filter((name) => name.startsWith('icon-'))
  .forEach((name) => fs.removeSync(path.join(distDir, name)))

fs.readdirSync(distDir)
  .filter((name) => /^metafile-.*\.json$/.test(name))
  .forEach((name) => {
    fs.moveSync(path.join(distDir, name), path.join(rootDir, name), {
      overwrite: true,
    })
  })
