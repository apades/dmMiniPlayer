export const isDev = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'
export const NEED_EXT_RELOAD = ['background']
export const NEED_PAGE_RELOAD = [
  'inject-top',
  'inject-all-frames-top',
  'entry-init-ext-config',
  'entry-inject-all-frames-top',
  'entry-inject-top',
]
export const WS_PORT = 4966
