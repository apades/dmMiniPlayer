import { OrPromise } from '@root/utils/typeUtils'

export type FileParserModule = {
  filter: RegExp | string | (string | RegExp)[]
  setup: (config: Config) => FileParserReturn
}
export type FileParserReturn = [
  readFile: (file: string) => OrPromise<any>,
  toJson: (content: string) => OrPromise<any>,
]

export type TranslateEntrypointModule = {
  enable: (config: Config) => boolean
  translate: (text: string, toLang: string, config: Config) => Promise<string>
}

export type Config =
  | BaseConfig
  | (Omit<BaseConfig, 'target' | 'targetConfig'> & {
      target: 'openai'
      targetConfig: {
        apiKey: string
        baseUrl?: string
        model: string
        promote?: string
        basePromote?: string
      }
    })

type BaseConfig = {
  rootDir?: string
  entry: string
  outputDir?: string
  toLangs: string[]
  /** @default 'google' */
  target?: 'google' | 'openai' | (string & {})
  targetConfig?: any
  proxyPort?: string | number
  /** @default 3 */
  threads?: number
}
