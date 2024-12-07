import { ATTR_DISABLE, ATTR_URL } from '@root/shared/config'
;(() => {
  const extBaseUrl = document.documentElement.getAttribute(ATTR_URL)
  if (document.documentElement.getAttribute(ATTR_DISABLE)) return

  console.log('⚡ run world script')
  ;(async () => {
    await import(extBaseUrl + 'inject.js').then((m) => m.run())
  })().catch(console.error)
})()
