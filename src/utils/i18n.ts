import en from '../locales/en.json'
import zhCn from '../locales/zh_CN.json'
import { get } from '.'

type DeepKeys<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]-?: `${K & string}` | Concat<K & string, DeepKeys<T[K]>>
    }[keyof T]
  : ''

type DeepLeafKeys<T> = T extends Record<string, unknown>
  ? { [K in keyof T]-?: Concat<K & string, DeepKeys<T[K]>> }[keyof T]
  : ''

type Concat<K extends string, P extends string> = `${K}${'' extends P
  ? ''
  : '.'}${P}`

export type I18nKeys = DeepLeafKeys<typeof zhCn>
export const nowLang = navigator.languages.find((lang) =>
  lang.toLocaleLowerCase().replace('_', '-').startsWith('zh')
)
  ? 'zh_CN'
  : 'en'

export const isEn = nowLang == 'en'

export function t(key: I18nKeys) {
  const langFile = isEn ? en : zhCn
  return get(langFile, key) as string
}
