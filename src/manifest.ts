import { Hono } from 'hono'
import { useTranslations } from 'next-intl'
import packageJson from '../package.json'
import {} from 'type-fest'

const version = packageJson.version

export const manifest: chrome.runtime.ManifestV3 = {
  name: '__MSG_appName__',
  description: '__MSG_appDesc__',
  author: 'apades',
  manifest_version: 3,
  homepage_url: 'https://github.com/apades/dmMiniPlayer',
  version,
  icons: {
    '16': 'assets/icon16.png',
    '32': 'assets/icon32.png',
    '48': 'assets/icon48.png',
    '64': 'assets/icon64.png',
    '128': 'assets/icon128.png',
  },
  action: {
    default_icon: {
      '16': 'assets/icon16.png',
      '32': 'assets/icon32.png',
      '48': 'assets/icon48.png',
      '64': 'assets/icon64.png',
      '128': 'assets/icon128.png',
    },
    default_popup: 'popup.html',
  },
  host_permissions: ['<all_urls>'],
  permissions: [
    'storage',
    'contextMenus',
    'activeTab',
    // 'tabCapture',
  ],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  content_scripts: [
    {
      js: ['before-init-main.js'],
      run_at: 'document_start',
      matches: ['<all_urls>'],
      all_frames: true,
    },
    {
      js: ['world.js'],
      run_at: 'document_start',
      world: 'MAIN',
      matches: ['<all_urls>'],
    },
    {
      js: ['world-pip.js'],
      run_at: 'document_start',
      world: 'MAIN',
      matches: ['<all_urls>'],
      all_frames: true,
    },
    {
      matches: ['<all_urls>'],
      js: ['entry-all-frames.js'],
      run_at: 'document_end',
      all_frames: true,
    },
  ],
  default_locale: 'en',
  web_accessible_resources: [
    {
      resources: ['assets/**/*'],
      matches: ['<all_urls>'],
    },
    {
      resources: ['assets/*'],
      matches: ['<all_urls>'],
    },
  ],
  commands: {
    back: {
      suggested_key: {
        default: 'Alt+Shift+Comma',
        windows: 'Alt+Shift+Comma',
        mac: 'Command+Shift+Left',
      },
      description: '__MSG_back__',
    },
    forward: {
      suggested_key: {
        default: 'Alt+Shift+Period',
        windows: 'Alt+Shift+Period',
        mac: 'Command+Shift+Right',
      },
      description: '__MSG_forward__',
    },
    'pause/play': {
      suggested_key: {
        default: 'Alt+Shift+M',
        windows: 'Alt+Shift+M',
        mac: 'Command+Shift+Space',
      },
      description: '__MSG_playOrPause__',
    },
    hide: {
      suggested_key: {
        default: 'Alt+Shift+H',
        windows: 'Alt+Shift+H',
        mac: 'Command+Shift+H',
      },
      description: '__MSG_hide__',
    },
    playbackRate: {
      description: '__MSG_playbackRate__',
    },
    quickHideToggle: {
      description: '__MSG_quickHideToggle__',
    },
  },
}

const a = new Hono()

a.get('/test/:a/:b/c', (c) => {
  c.req.param('b')
})

const t = useTranslations('a1')
t('a13')

type ICUTags<
  MessageString extends string,
  TagsFn,
> = MessageString extends `${infer Prefix}<${infer TagName}>${infer Content}</${string}>${infer Tail}`
  ? Record<TagName, TagsFn> & ICUTags<`${Prefix}${Content}${Tail}`, TagsFn>
  : {}

type ICUTags2<
  MessageString extends string,
  TagsFn,
> = MessageString extends `${infer Prefix}{${infer TagName}}${infer Tail}`
  ? Record<TagName, TagsFn> & ICUTags2<`${Prefix}${Tail}`, TagsFn>
  : {}

type t1 = ICUTags<'test<div> {bbb}</div> bvbb', string>

let a1: t1 = {
  div: 'asd',
}

type t2 = ICUTags2<'test<div> {bbb} {cccc}', string>

let b1: t2 = {
  bbb: 'ccc',
  cccc: '22',
}

/**
 * 按模板将字符串拆分成联合类型
 *
 * @example
 * ```ts
 * type Split1 = SplitTemplateStringToUnion<'{content}', 'aaa {a1} {a2} bbbb'> // 'a1' | 'a2'
 * const sp: Split1 = 'a1'
 *
 * type Split2 = SplitTemplateStringToUnion<'%content%', 'aaa %a1% %a2% bbbb'> // 'a1' | 'a2'
 * const sp: Split2 = 'a1'
 * ```
 */
type SplitTemplateStringToUnion<
  template extends `${string}content${string}`,
  tarString extends string,
> = template extends `${infer Prefix}content${infer Tail}`
  ? tarString extends `${infer tPre}${Prefix}${infer Content}${Tail}${infer tTail}`
    ? Content | SplitTemplateStringToUnion<template, `${tPre}${tTail}`>
    : never
  : never

type Split1 = SplitTemplateStringToUnion<'{content}', 'asads{a1}{a2}bb'>
const sp1: Split1 = 'a1'
// useless
type Split2 = SplitTemplateStringToUnion<`/:content`, '/path/:aa/:a2'>
const sp2: Split2 = 'a'

/**
 * 按字符将字符串拆分成联合类型
 *
 * @example
 * ```ts
 * type Split = SplitStringToUnion<'/', '/path/to/file.html'> // 'path' | 'to' | 'file.html'
 * const sp: Split = 'file.html'
 * ```
 */
type SplitStringToUnion<
  split extends string,
  tarString extends string,
> = tarString extends `${infer tPre}${split}${infer tTail}`
  ? tPre | SplitStringToUnion<split, tTail>
  : tarString

type Split3 = SplitStringToUnion<'/', '/path/to/file.html'>
const sp3: Split3 = 'file.html'

type Split4 = SplitStringToUnion<'/:', '/path/p2/:a1/p4/p5/:a2/p3'>
const sp4: Split4 = '/path/p2'

type FilterUnionUnStartWith<
  Union,
  Prefix extends string,
> = Union extends `${Prefix}${string}` ? never : Union

type SplitStringToArray<
  split extends string,
  tarString extends string,
> = tarString extends `${infer tPre}${split}${infer tTail}`
  ? [tPre, ...SplitStringToArray<split, tTail>]
  : [tarString]

type FilterSplit4 = FilterUnionUnStartWith<Split4, '/'>
type ArraySplit4 = SplitStringToArray<'/', FilterSplit4>

type GetArrayFirst<T extends any[]> = T extends [infer First, ...any[]]
  ? First
  : never

type GetFirstSplit4 = GetArrayFirst<ArraySplit4>
const sp42: GetFirstSplit4 = 'a1'

/**
 * 将union类型宽松化
 * @example
 * ```ts
 * type Union = 'a' | 'b'
 * const a1: Union = 'c' // error
 * const a2: LooseUnion<Union> = 'c' // ok
 */
type LooseUnion<T> = T | (string & {})

type Unt1 = LooseUnion<Split1>
const unt1: Unt1 = 'a3'

type Unt2 = LooseUnion<'a' | { t: true }>
const unt2: Unt2 = { t: true }

type Unt3 = LooseUnion<{ t: false; a1: string } | { t: true; a2: string }>
const unt3: Unt3 = { asd: '1' }
