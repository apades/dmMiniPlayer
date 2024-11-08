import path from 'path'
import fetch from 'node-fetch'
import fs from 'fs-extra'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { cloneDeep, get, isEqual, isEqualWith, set } from 'lodash-es'
import { Language } from '@root/utils/i18n'

const proxyPort = process.argv[2] || 7890
const proxyUrl = `http://127.0.0.1:${proxyPort}`
const proxyAgent = new HttpsProxyAgent(proxyUrl)

const transForLangs = Object.values(Language).filter(
  (v) => v !== Language.English
)

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

  const translatedJson = fs.readJsonSync(translatedSaveFile)
  const sourceJson = fs.readJsonSync(sourceFile)

  try {
    for (const lang of transForLangs) {
      const translateTargetFile = path.resolve(
        targetDir,
        `./${lang.replace('-', '_')}.json`
      )
      const translateTargetJson = fs.readJsonSync(translateTargetFile)
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

      console.log(lang, needTranslateMap)

      const needTranslateEntries = Object.entries(needTranslateMap)
      if (needTranslateEntries.length > 0) {
        const translateResult = await googleTranslate(
          Object.values(needTranslateMap),
          lang
        )

        needTranslateEntries.forEach(([deepKey, val], index) => {
          set(copySource, deepKey, translateResult[index])
        })
      }

      fs.writeJsonSync(translateTargetFile, copySource, { spaces: 2 })
    }

    // 完成了就复制source到translated
    fs.writeJsonSync(translatedSaveFile, sourceJson, { spaces: 2 })
  } catch (error) {
    console.error(error)
  }
}

main({
  targetDir: path.resolve(__dirname, '../src/locales'),
  sourceFile: path.resolve(__dirname, '../src/locales/en.json'),
})

main({
  targetDir: path.resolve(__dirname, '../src/locales-ext'),
  sourceFile: path.resolve(__dirname, '../src/locales-ext/en.json'),
})
