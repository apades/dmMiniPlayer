export const DEFAULT_EVENT_INJECT_SITE = [
  '/https:\\/\\/live\\.douyin\\.com\\/.*/',
  '/https:\\/\\/www\\.twitch\\.com\\/.*/',
  '/https:\\/\\/www\\.youtube\\.com\\/.*/',
  '/https:\\/\\/www\\.douyu\\.com\\/.*/',
  '/https:\\/\\/www\\.bilibili\\.com\\/.*/',
]

/**附加在<html />上，表示禁用插件在该网站上 */
export const ATTR_DISABLE = 'dm-disable'
export const ATTR_EVENT_INJECT_SITES = 'dm-event-inject-sites'
/**附加在<html />上，插件的地址，用来给其他world: MAIN加载插件资源用的 */
export const ATTR_URL = 'dm-url'
/**每个<video />带的id的属性名 */
export const VIDEO_ID_ATTR = 'data-dm-vid'
