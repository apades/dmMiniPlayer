;(() => {
  const extBaseUrl = document.documentElement.getAttribute('dm-url')
  if (document.documentElement.getAttribute('dm-disable')) return

  console.log('⚡ run world script')
  ;(async () => {
    await import(extBaseUrl + 'inject.js').then((m) => m.run())
  })().catch(console.error)
})()
