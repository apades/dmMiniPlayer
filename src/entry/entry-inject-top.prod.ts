import { run } from '../contents/inject-top'
import { onExtLoaded } from './utils'

onExtLoaded(() => {
  console.log(`⚡ run inject-top script, url: ${location.href}`)
  run()
})
