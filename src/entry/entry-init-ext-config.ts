/**
 * 该脚本是用来读取用户设置，并挂在在document.documentElement attr上给后面插件读取的
 *
 * 该脚本优先级最高，而且放在document.documentElement上也能给top层脚本使用
 */
import {
  ATTR_DISABLE,
  ATTR_DISABLE_INJECT_PIP,
  ATTR_LOADED,
  ATTR_URL,
} from '@root/shared/config'
import isDev from '@root/shared/isDev'
import { DM_MINI_PLAYER_CONFIG } from '@root/shared/storeKey'
import { getBrowserSyncStorage } from '@root/utils/storage'

// dev模式中，通过`import(extBaseUrl + 'inject.js').then((m) => m.run())`来实现不刷新插件，只用刷新页面就可以运行 `world: 'main'` 的代码。由于inject.js处于top层，`chrome.runtime.getURL`方法没法在top层使用，只能用此策略
// ? 为什么只在dev中:
// #51 提了个关于importmap的网站，会导致在top层的import失效
if (isDev) {
  document.documentElement.setAttribute(ATTR_URL, chrome.runtime.getURL(''))
}

const setAttr = (key: string, value: string) => {
  document.documentElement.setAttribute(key, value)
}
getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG).then((config) => {
  // 注入网站的pip设置
  if (config?.injectPIPFn === false) {
    setAttr(ATTR_DISABLE_INJECT_PIP, 'true')
  }

  // 网站禁用功能
  const isDisable = (config?.disable_sites ?? []).find((site) => {
    const isRegex = site.startsWith('/') && site.endsWith('/')
    if (isRegex)
      return new RegExp(site.match(/^\/(.*)\/$/)?.[1] ?? '').test(location.href)
    return location.href.includes(site)
  })
  if (isDisable) {
    setAttr(ATTR_DISABLE, 'true')
  }

  setAttr(ATTR_LOADED, 'true')
})
