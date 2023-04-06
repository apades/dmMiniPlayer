/**
 * @description 读取src/pages成entry,Plugin配置
 */
const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

let isFolder = (path) => fs.lstatSync(path).isDirectory()
let pr = (..._path) => path.resolve(__dirname, ..._path)

let pagesSrc = pr('../src/pages/')
let pagesDirs = fs.readdirSync(pagesSrc)

let dataList = pagesDirs.map((dir) => {
  let realPath = pr(pagesSrc, dir)
  let isfolder = isFolder(realPath)
  let entry,
    html,
    label = dir.replace(/\..*$/g, '')
  if (isfolder) {
    entry =
      (fs.existsSync(pr(realPath, 'index.ts')) && pr(realPath, 'index.ts')) ||
      (fs.existsSync(pr(realPath, 'index.tsx')) && pr(realPath, 'index.tsx')) ||
      null
    html =
      fs.existsSync(pr(realPath, 'index.html')) && pr(realPath, 'index.html')
  }
  if (!isfolder) {
    entry = (dir.indexOf('ts') > 0 && realPath) || null
    html = (dir.indexOf('html') > 0 && realPath) || null
  }

  return {
    label,
    entry,
    html,
  }
})

let entry = {}
dataList.forEach((data) => {
  data.entry && (entry[data.label] = data.entry)
})

let WebpackPluginList = []

console.log(dataList)
dataList.forEach((data) => {
  if (data.entry) {
    WebpackPluginList.push(
      new HtmlWebpackPlugin({
        chunks: [data.label],
        template: data.html,
        filename: `${data.label}.html`,
      })
    )
  } else if (data.html) {
    WebpackPluginList.push(
      new CopyPlugin({
        patterns: [
          {
            from: data.html,
            to: '',
          },
        ],
      })
    )
  }
})

module.exports = {
  entry,
  WebpackPluginList,
}
