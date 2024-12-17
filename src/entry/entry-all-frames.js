;(function () {
  'use strict'
  ;(async () => {
    await Promise.all([
      import('./react-refresh.js'),
      import('http://localhost:4196/@vite/client'),
      import(`http://localhost:4196/src/contents/main.ts`),
    ])
  })().catch(console.error)
})()
