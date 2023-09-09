import { pr, spawn } from './utils.mjs'
import fs from 'fs-extra'

const buildDir = pr('../build/chrome-mv3-prod/')

async function main() {
  await spawn('npx', ['plasmo', 'build'])
  // console.log('build')

  const dirs = fs.readdirSync(pr(buildDir))
  const mainJs = dirs.filter((dir) => /^main\..*?\.js/.test(dir))
  const jsonFile = pr(buildDir, 'manifest.json')
  const manifest = fs.readJSONSync(jsonFile)

  manifest.content_scripts.forEach((el) => {
    if (!mainJs.includes(el.js[0])) return
    el.js = mainJs
  })

  fs.writeJSONSync(jsonFile, manifest)
}

main()
