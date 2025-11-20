import { onExtLoaded } from './utils'

onExtLoaded(({ extBaseUrl }) => {
  console.log(`⚡ run inject-top script, url: ${location.href}`)
  ;(async () => {
    await import(extBaseUrl + 'inject-top.js').then((m) => m.run())
  })().catch(console.error)
})
