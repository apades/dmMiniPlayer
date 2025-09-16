import path from 'path'
import { ArgumentParser } from 'argparse'
import fs from 'fs-extra'
import { cloneDeep, get, isArray, isEqual, isRegExp, set } from 'lodash-es'
import { PromisePool } from 'minimal-promise-pool'
import { Config, FileParserModule, TranslateEntrypointModule } from './types'

const parser = new ArgumentParser()
parser.add_argument('-port', {
  help: 'proxy port, default 7890',
  default: 7890,
})
parser.add_argument('-e', { help: 'entry file' })
parser.add_argument('-o', { help: 'output file dir' })
// parser.add_argument('-root', {
//   help: 'root path, default ../',
//   default: '../',
// })
parser.add_argument('-lang', {
  help: 'to translate language, default en,zh_CN,zh_TW,es,fr,ja,ko',
  default: 'en,zh_CN,zh_TW,es,fr,ja,ko',
})
parser.add_argument('-target', {
  help: 'translate entrypoint, google or openai, or plugins (doing)',
  default: 'google',
})
parser.add_argument('-threads', {
  help: 'default 3',
  default: 3,
})

const args = parser.parse_args()

async function main() {
  const config: Config = {
    entry: args.e,
    outputDir: args.o,
    rootDir: '',
    toLangs: args.lang.split(','),
    proxyPort: args.port,
    threads: args.threads,
  }

  const sourceFile = path.resolve(process.cwd(), config.entry),
    targetDir = path.resolve(process.cwd(), config.entry, '../')

  const translatedSaveFile = path.resolve(targetDir, './.translated.json')

  const fileName = sourceFile.split(path.sep).pop()
  if (!fileName) throw new Error('file name is empty')
  const fileType = fileName.split('.').pop()
  if (!fileType) throw new Error('file type is empty')

  const fileParserModuleNames = fs.readdirSync(
    path.resolve(__dirname, './file-parser'),
  )

  const fileParserModule = await new Promise<FileParserModule | null>(
    async (res) => {
      for (const moduleName of fileParserModuleNames) {
        const module = (await import(`./file-parser/${moduleName}`))
          .default as FileParserModule

        const filter = isArray(module.filter) ? module.filter : [module.filter]

        if (
          filter.find((f) => {
            if (isRegExp(f)) return f.test(fileName)
            return f === fileName
          })
        ) {
          res(module)
          return
        }
      }
      res(null)
    },
  )

  if (!fileParserModule) throw new Error(`.${fileType} file parser not found`)

  const translateEntrypointModuleNames = fs.readdirSync(
    path.resolve(__dirname, './file-parser'),
  )
  const translateEntrypointModule =
    await new Promise<TranslateEntrypointModule | null>(async (res) => {
      for (const moduleName of fileParserModuleNames) {
        const module = (await import(`./translate-entrypoint/${moduleName}`))
          .default as TranslateEntrypointModule

        if (module.enable(config)) {
          res(module)
          return
        }
      }
      res(null)
    })
  if (!translateEntrypointModule)
    throw new Error(`translate entrypoint not found :${config.target}`)

  if (!fs.existsSync(translatedSaveFile)) {
    fs.writeJsonSync(translatedSaveFile, {})
  }
  const [readFile, toJson] = fileParserModule.setup(config)
  const writeFile = async (file: string, data: any) => {
    const str = await toJson(data)
    return fs.writeFile(file, str, 'utf-8')
  }

  const translatedJson = fs.readJsonSync(translatedSaveFile)
  const sourceJson = readFile(sourceFile)

  const threadsManager = new PromisePool(config.threads ?? 3)

  try {
    for (const toLang of config.toLangs) {
      const translateTargetFile = path.resolve(
        targetDir,
        `./${toLang.replace('-', '_')}.${fileType}`,
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
      const translateResult = await Promise.all(
        needTranslateEntries.map(([key, val]) => {
          return threadsManager.runAndWaitForReturnValue(() =>
            translateEntrypointModule.translate(val, toLang, config),
          )
        }),
      )

      needTranslateEntries.forEach(([deepKey, val], index) => {
        set(copySource, deepKey, translateResult[index])
        set(needTranslateMap, deepKey, translateResult[index])
      })

      console.log(toLang, needTranslateMap)

      writeFile(translateTargetFile, copySource)
    }

    // 完成了就复制source到translated
    fs.writeJsonSync(translatedSaveFile, sourceJson, { spaces: 2 })
  } catch (error) {
    console.error(error)
  }
}

main()
