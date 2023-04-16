import { onMessage_inject } from './injectListener'
import './eventHacker'

onMessage_inject('run-code', async (data) => {
  // console.log('runFn', data)
  let fn = new Function(`return (${data.function})(...arguments)`)

  let rs = await fn(...(data.args ?? []))
  return rs
})

onMessage_inject('msg-test', (data) => {
  console.log('top window msg-test log', data)
  return data
})
