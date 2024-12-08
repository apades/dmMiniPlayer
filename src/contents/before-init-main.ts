import {
  ATTR_DISABLE,
  ATTR_EVENT_INJECT_SITES,
  ATTR_URL,
  DEFAULT_EVENT_INJECT_SITE,
} from '@root/shared/config'
import { DM_MINI_PLAYER_CONFIG } from '@root/shared/storeKey'
import { getBrowserSyncStorage } from '@root/utils/storage'

// 用来实现world: main 中chrome.runtime.getURL的效果
document.documentElement.setAttribute(ATTR_URL, chrome.runtime.getURL(''))

getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG).then((config) => {
  const isDisable = (config?.disable_sites ?? []).find((site) => {
    const isRegex = site.startsWith('/') && site.endsWith('/')
    if (isRegex)
      return new RegExp(site.match(/^\/(.*)\/$/)?.[1] ?? '').test(location.href)
    return location.href.includes(site)
  })
  // const eventInjectSites = btoa(
  //   JSON.stringify(config?.eventInject_sites ?? DEFAULT_EVENT_INJECT_SITE)
  // )
  // document.documentElement.setAttribute(
  //   ATTR_EVENT_INJECT_SITES,
  //   eventInjectSites
  // )

  if (!isDisable) return
  document.documentElement.setAttribute(ATTR_DISABLE, 'true')
})
