import { onExtLoaded } from './utils'

onExtLoaded(({ extBaseUrl }) => {
  console.log(`⚡ run inject-all-frames-top script, url: ${location.href}`)
  ;(async () => {
    await import(extBaseUrl + 'inject-pip.js').then((m) => m.run())
  })().catch(console.error)
})
