import { ATTR_DISABLE } from '@root/shared/config'
import { LOCALE } from '@root/shared/storeKey'
import { getBrowserLocalStorage } from '@root/utils/storage'
;(async () => {
  if (document.documentElement.getAttribute(ATTR_DISABLE)) return

  await getBrowserLocalStorage(LOCALE).then((LOCALE) => {
    if (!LOCALE) return
    window.__LOCALE = LOCALE
  })
  await Promise.all([
    import(chrome.runtime.getURL('clogInject.js')),
    import(chrome.runtime.getURL('main.js')),
  ])
})().catch(console.error)
