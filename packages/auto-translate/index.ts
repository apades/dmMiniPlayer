import path from 'path'
import { ArgumentParser } from 'argparse'
import fs from 'fs-extra'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { cloneDeep, get, isEqual, set } from 'lodash-es'
import fetch from 'node-fetch'
import { parse, stringify } from 'smol-toml'
import { stringify as jStringify } from '@ltd/j-toml'
import { load as yamlLoad, dump as yamlDump } from 'js-yaml'

const parser = new ArgumentParser()
parser.add_argument('-port', { help: 'proxy port', default: 7890 })
parser.add_argument('-e', { help: 'entry file' })

const args = parser.parse_args()

const proxyUrl = `http://127.0.0.1:${args.port}`
const proxyAgent = new HttpsProxyAgent(proxyUrl)
const fileName = (args.e as string).split('/').pop()?.split('.').shift()

enum Language {
  English = 'en',
  'Chinese(Simplified)' = 'zh_CN',
  'Chinese(Traditional)' = 'zh_TW',
  // 按知名度排序
  Spanish = 'es',
  French = 'fr',
  Japanese = 'ja',
  Korean = 'ko',
}
const transForLangs = Object.values(Language).filter((v) => v !== fileName)

const googleTranslate = (textArr: string[], target: string) => {
  const url = `https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=${target}&hl=zh-CN&dt=t&dt=bd&ie=UTF-8&oe=UTF-8&dj=1&source=icon`
  return fetch(url, {
    method: 'POST',
    body: textArr.map((v) => `q=${encodeURIComponent(v)}`).join('&'),
    agent: proxyAgent,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    },
  })
    .then((res) => res.json())
    .then((res: any) => res.map((v: any) => v[0]))
}

async function main(props: { targetDir: string; sourceFile: string }) {
  const { sourceFile, targetDir } = props
  const translatedSaveFile = path.resolve(targetDir, './.translated.json')

  const [mode, endName, readFile, writeFile] = (() => {
    const endName = sourceFile.split('.').pop()
    const mode = (() => {
      switch (endName) {
        case 'json':
          return 'json'
        case 'toml':
          return 'toml'
        case 'yaml':
        case 'yml':
          return 'yaml'
        default:
          return endName
      }
    })()

    return [
      mode,
      endName,
      ...(() => {
        switch (mode) {
          case 'json':
            return [
              fs.readJsonSync,
              (file: string, data: any) => {
                fs.writeJsonSync(file, data, { spaces: 2 })
              },
            ] as const
          case 'toml':
            return [
              (file: string) => {
                return parse(fs.readFileSync(file, 'utf-8'))
              },
              (file: string, data: any) => {
                const str = jStringify(data, {
                  xBeforeNewlineInMultilineTable: ',',
                })
                fs.writeFileSync(file, str, 'utf-8')
              },
            ] as const
          case 'yaml':
            return [
              (file: string) => {
                return yamlLoad(fs.readFileSync(file, 'utf-8'))
              },
              (file: string, data: any) => {
                fs.writeFileSync(
                  file,
                  yamlDump(data).replaceAll('\n\n\n', '\n\n'),
                  'utf-8',
                )
              },
            ] as const
          default:
            return [() => {}, () => {}] as const
        }
      })(),
    ]
  })()

  if (!fs.existsSync(translatedSaveFile)) {
    fs.writeJsonSync(translatedSaveFile, {})
  }

  console.log('mode', mode)

  const translatedJson = fs.readJsonSync(translatedSaveFile)
  const sourceJson = readFile(sourceFile)

  try {
    for (const lang of transForLangs) {
      const translateTargetFile = path.resolve(
        targetDir,
        `./${lang.replace('-', '_')}.${endName}`,
      )

      const translateTargetJson = fs.existsSync(translateTargetFile)
        ? readFile(translateTargetFile)
        : {}
      const copySource = cloneDeep(sourceJson)

      /** deepKey -> val */
      const needTranslateMap: Record<string, string> = {}

      const translate = (obj: Record<string, any>, baseKey = '') => {
        for (const key in obj) {
          const deepKey = baseKey ? `${baseKey}.${key}` : key

          if (typeof obj[key] === 'string') {
            const val = get(translateTargetJson, deepKey)
            if (
              // 如果已经翻译过，就略过
              isEqual(get(translatedJson, deepKey), get(sourceJson, deepKey)) &&
              !!val
            ) {
              set(copySource, deepKey, val)
              continue
            } else {
              needTranslateMap[deepKey] = obj[key]
            }
          } else {
            translate(obj[key], deepKey)
          }
        }
      }

      translate(sourceJson)

      const needTranslateEntries = Object.entries(needTranslateMap)
      if (needTranslateEntries.length > 0) {
        const translateResult = await googleTranslate(
          Object.values(needTranslateMap),
          lang,
        )

        needTranslateEntries.forEach(([deepKey, val], index) => {
          set(copySource, deepKey, translateResult[index])
          set(needTranslateMap, deepKey, translateResult[index])
        })
      }

      console.log(lang, needTranslateMap)

      writeFile(translateTargetFile, copySource)
    }

    // 完成了就复制source到translated
    fs.writeJsonSync(translatedSaveFile, sourceJson, { spaces: 2 })
  } catch (error) {
    console.error(error)
  }
}

main({
  targetDir: path.resolve(process.cwd(), args.e, '../'),
  sourceFile: path.resolve(process.cwd(), args.e),
})
