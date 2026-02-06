export const isDev = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'
export const NEED_EXT_RELOAD = ['background']
export const NEED_PAGE_RELOAD = [
  'inject-top',
  'inject-pip',
  'entry-init-ext-config',
  'world',
  'entry-inject-all-frames-top',
]
export const WS_PORT = 4966
