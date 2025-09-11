import {
  ATTR_DISABLE,
  ATTR_DISABLE_INJECT_PIP,
  ATTR_URL,
} from '@root/shared/config'
import isDev from '@root/shared/isDev'
import { DM_MINI_PLAYER_CONFIG } from '@root/shared/storeKey'
import { getBrowserSyncStorage } from '@root/utils/storage'

// dev模式中，通过`import(extBaseUrl + 'inject.js').then((m) => m.run())`来实现不刷新插件，只用刷新页面就可以运行 `world: 'main'` 的代码。由于inject.js处于top层，`chrome.runtime.getURL`方法没法在top层使用，只能用此策略
if (isDev) {
  document.documentElement.setAttribute(ATTR_URL, chrome.runtime.getURL(''))
}

getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG).then((config) => {
  if (config?.injectPIPFn === false) {
    document.documentElement.setAttribute(ATTR_DISABLE_INJECT_PIP, 'true')
  }

  const isDisable = (config?.disable_sites ?? []).find((site) => {
    const isRegex = site.startsWith('/') && site.endsWith('/')
    if (isRegex)
      return new RegExp(site.match(/^\/(.*)\/$/)?.[1] ?? '').test(location.href)
    return location.href.includes(site)
  })

  if (!isDisable) return
  document.documentElement.setAttribute(ATTR_DISABLE, 'true')
})
