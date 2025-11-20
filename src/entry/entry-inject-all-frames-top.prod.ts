import { run } from '../contents/inject-all-frames-top'
import { onExtLoaded } from './utils'

onExtLoaded(() => {
  console.log(`⚡ run inject-all-frames-top script, url: ${location.href}`)
  run()
})
