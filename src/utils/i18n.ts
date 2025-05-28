import { get, onceCall } from '.'
import en from '../locales/en.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import ja from '../locales/ja.json'
import ko from '../locales/ko.json'
import zhCN from '../locales/zh_CN.json'
import zhTW from '../locales/zh_TW.json'

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

export enum Language {
  English = 'en',
  'Chinese(Simplified)' = 'zh_CN',
  'Chinese(Traditional)' = 'zh_TW',
  // 按知名度排序
  Spanish = 'es',
  French = 'fr',
  Japanese = 'ja',
  Korean = 'ko',
}

export const LanguageNativeNames: Record<Language, string> = {
  en: 'English',
  zh_CN: '中文(简体)',
  zh_TW: '中文(繁體)',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
}

const i18nMap: Record<Language, any> = {
  en: en,
  es: es,
  fr: fr,
  ja: ja,
  ko: ko,
  zh_CN: zhCN,
  zh_TW: zhTW,
}

export const defaultLang = Language.English

export type I18nKeys = DeepLeafKeys<typeof en>

const formatLang = (lang: string) => lang.replace('-', '_') as any
const langKeys = Object.values(Language)

const getLangFromNavigator = onceCall(
  (): Language =>
    formatLang(
      navigator.languages.find((lang) => langKeys.includes(formatLang(lang))) ||
        Language.English,
    ),
)

export const getNowLang = (): Language =>
  (globalThis as any).__LOCALE || getLangFromNavigator()

export const getIsZh = () =>
  getNowLang() === Language['Chinese(Simplified)'] ||
  getNowLang() === Language['Chinese(Traditional)']

const getLangFile = () => i18nMap[getNowLang()]
export function t(key: I18nKeys) {
  const langFile = getLangFile()
  return (get(langFile, key) || get(en, key)) as string
}
