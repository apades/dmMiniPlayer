// 有些网站注入eventHacker会导致网页出现问题
// @example https://github.com/apades/dmMiniPlayer/issues/11
// 现在只提供需要注入的网址就行了

import { DEFAULT_EVENT_INJECT_SITE } from '@root/shared/config'

// import { ATTR_EVENT_INJECT_SITES } from '@root/shared/config'

// export const eventHackerEnableSites = JSON.parse(
//   atob(document.documentElement.getAttribute(ATTR_EVENT_INJECT_SITES) ?? '[]')
// )

export const eventHackerEnableSites = DEFAULT_EVENT_INJECT_SITE
