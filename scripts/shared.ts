export const isDev = process.env.NODE_ENV === 'development'
export const NEED_EXT_RELOAD = ['background']
export const NEED_PAGE_RELOAD = [
  'inject',
  'inject-pip',
  'before-init-main',
  'world',
  'world-pip',
]
export const WS_PORT = 4966
