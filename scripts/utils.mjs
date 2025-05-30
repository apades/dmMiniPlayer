import { spawn as _spawn } from 'child_process'
import path from 'path'
import * as url from 'url'
import fs from 'fs-extra'
import { getDefinesObject } from '@apad/env-tools/lib/bundler.js'
export const __filename = url.fileURLToPath(import.meta.url)
export const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export function spawn(...args) {
  const child = _spawn(...args, {
    env: process.env,
    shell: true,
  })
  console.log(`⚡ ${args[0]} ${args[1].join(' ')}`)
  return new Promise((res) => {
    let rs = ''
    child.on('close', () => res(rs))
    child.stderr.pipe(process.stderr)
    child.stdout.pipe(process.stdout)
    child.stdout.on('data', (data) => (rs += data.toString()))
    child.stderr.on('data', (data) => (rs += data.toString()))
    process.stdin.pipe(child.stdin)
  })
}

export function pr(...args) {
  return path.resolve(__dirname, ...args).replaceAll('\\', '/')
}

export function getChangeLog(ver, lang) {
  const targetFile =
    lang === 'zh' ? pr('../docs/changeLog-zh.md') : pr('../docs/changeLog.md')

  const regex = new RegExp(`## v${ver}\\s*([\\s\\S]*?)(?=## v|$)`)

  return fs.readFileSync(targetFile, 'utf-8').match(regex)?.[1].trim?.()
}

function omit(obj, key) {
  let rs = { ...obj }
  key.forEach((k) => delete rs[k])
  return rs
}

export function getDefinesConfig(
  /**@type {'prod'| 'dev'} */
  type,
  extend = {},
) {
  return omit(getDefinesObject(type, extend), ['process.env'])
}
