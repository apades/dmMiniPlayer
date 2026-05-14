import path from 'path'
import { tryCatch } from '@root/utils'
import chalk from 'chalk'
import { program } from 'commander'
import fs from 'fs-extra'
import tsup, { build, defineConfig } from 'tsup'
import packageData from '../package.json' with { type: 'json' }
import { getConfig } from './build.config'
import {
  getSiteAdapterPresetSettings,
  getSiteAdapterPresetSettingsCode,
  OFFICIAL_ADAPTER_CONFIG_FILE,
} from './build-helpers'

const pr = (...args: string[]) =>
  path.resolve(process.cwd(), ...args).replaceAll('\\', '/')

program.version(packageData.version, '-v, --version')

program
  .option('-d, --dev', 'dev mode', false)
  .option('-o, --official', 'official mode', false)
  .option('--out-dir', 'output directory', 'dist')
  .arguments('<files...>')
  .action(
    async (
      files: string[],
      options: { dev: boolean; official: boolean; outDir: string },
    ) => {
      if (!files.length) {
        program.error('pass at least one adapter path')
      }

      const indexFileList = ['index.ts', 'index.js']
      type BuildTarget = { key: string; filePath: string }
      const targets: BuildTarget[] = []

      for (const entry of files) {
        let filePath = pr(entry)
        tryCatch(() => {
          if (fs.statSync(filePath).isDirectory()) {
            const indexFile = indexFileList.find((ext) =>
              fs.existsSync(pr(filePath, ext)),
            )
            if (indexFile) {
              filePath = pr(filePath, indexFile)
            }
          }
        })

        let key = path.basename(filePath)
        if (indexFileList.includes(key)) {
          key = path.basename(path.dirname(filePath))
        }

        targets.push({ key, filePath })
      }

      const entryMap: Record<string, string> = {}
      for (const { key, filePath } of targets) {
        if (Object.hasOwn(entryMap, key)) {
          program.error(`duplicate adapter key: ${key}`)
        }
        entryMap[key] = filePath
      }

      const localConfig = defineConfig({
        outDir: pr(options.outDir),
        entry: entryMap,
        ...getConfig({
          isDev: options.dev,
          isOfficial: options.official,
        }),
        silent: true,
        async onSuccess() {
          let [, config] = await tryCatch(() =>
            fs.readJSONSync(OFFICIAL_ADAPTER_CONFIG_FILE),
          )
          config ??= {}

          for (const { key, filePath } of targets) {
            try {
              const presetSettings =
                await getSiteAdapterPresetSettings(filePath)
              const presetSettingsCode =
                getSiteAdapterPresetSettingsCode(presetSettings)
              fs.writeFileSync(
                pr(options.outDir, `${key}.js`),
                presetSettingsCode,
                {
                  flag: 'a',
                },
              )

              config[key] = presetSettings

              console.log(
                chalk.green('[build success]'),
                `key: ${chalk.yellow(key)}, path: ${chalk.yellow(filePath)}`,
              )
            } catch (error) {
              console.log(
                chalk.red('[build failed]'),
                `key: ${chalk.yellow(key)}, path: ${chalk.yellow(filePath)}`,
              )
              console.log(error)
            }
          }

          fs.writeJSONSync(OFFICIAL_ADAPTER_CONFIG_FILE, config, {
            spaces: 2,
          })
        },
      }) as tsup.Options

      try {
        await build(localConfig)
      } catch (error) {
        console.log(chalk.red('[build failed]'), error)
        return
      }
    },
  )

program.parse()
