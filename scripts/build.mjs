import { pr, spawn } from './utils.mjs'
import fs from 'fs-extra'
import archiver from 'archiver'

const buildName = 'chrome-mv3-prod.zip'
const buildOutputDist = pr('../dist')
const outputDir = pr(`../build/${buildName}`)
fs.removeSync(buildOutputDist)
fs.removeSync(outputDir)

async function main() {
  await spawn('npx', ['vite', 'build'])
  // 莫名其妙的build不会触发脚本里面的cp
  // fs.copySync(pr('../locales'), pr(buildOutputDist, './_locales'))

  const viteConfigSrc = pr(buildOutputDist, '.vite/manifest.json')
  const viteConfig = fs.readJSONSync(viteConfigSrc)

  // popup页面build没有放对应的脚本，需要自己主动放进去，干
  const popupHtmlSrc = pr(buildOutputDist, 'src/popup/index.html')
  const popupHtml = fs.readFileSync(popupHtmlSrc, 'utf-8')
  const popupJsFileUrl = viteConfig['src/popup/index.html']?.file
  if (!popupJsFileUrl) {
    throw Error(`.vite/manifest.json没有popup的js文件 ${viteConfigSrc}`)
  }
  if (!popupHtml.includes(popupJsFileUrl)) {
    const newPopupHtml = popupHtml.replace(
      '</body>',
      `<script type="module" src="/${popupJsFileUrl}"></script></body>`
    )
    fs.outputFileSync(popupHtmlSrc, newPopupHtml)
  }

  // 打包zip
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })
  archive.pipe(fs.createWriteStream(outputDir))
  archive.directory(buildOutputDist, false)

  await archive.finalize()
}

main()
