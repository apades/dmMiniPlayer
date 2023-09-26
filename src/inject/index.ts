import { onMessage_inject, sendMessage_inject } from './injectListener'
import './eventHacker'
import './fetchHacker'
import './injectPIPFunction'
import { injectFunction } from '@root/utils/injectFunction'
import { get } from '@root/utils'

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

onMessage_inject('inject-api:run', (data) => {
  injectFunction(get(window, data.origin) as any, data.keys, (...args) => {
    sendMessage_inject('inject-api:onTrigger', {
      args,
      event: data.onTriggerEvent,
    })
  })
})
