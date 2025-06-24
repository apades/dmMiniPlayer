;(function () {
  'use strict'
  ;(async () => {
    if (document.documentElement.getAttribute('dm-disable')) return

    await chrome.storage.local.get('LOCALE').then((res) => {
      if (!res['LOCALE']) return
      window.__LOCALE = res['LOCALE']
    })
    await Promise.all([
      import('./react-refresh.js'),
      import('http://localhost:4196/@vite/client'),
      fetch('http://localhost:4196/src/background/index.ts'),
      import(`http://localhost:4196/src/contents/main.ts`),
    ])
  })().catch(console.error)
})()
