import { injectFunction } from '@root/utils/injectFunction'
import { get } from '@root/utils'
import { onMessage_inject, sendMessage_inject } from './injectListener'
import './eventHacker'
import './createElementHacker'
import './netflix'
// import './fetchHacker'

onMessage_inject('run-code', async (data) => {
  // console.log('runFn', data)
  let fn = new Function(`return (${data.function})(...arguments)`)

  let rs = await fn(...(data.args ?? []))
  return rs
})

onMessage_inject('get-data', (data) => {
  const rs = get(window, data.keys.join('.'))
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

try {
  const HISTORY_INJECT_SITE = [
    'https://www.youtube.com',
    'https://www.bilibili.com',
    'https://ddys.art',
    'https://ddys.pro',
    // 'https://www.netflix.com',
  ]

  // youtube的history.pushState是提前存好地址了的，这后面再改就没用了，所以需要提前修改
  if (HISTORY_INJECT_SITE.includes(window.location.origin)) {
    try {
      console.log('💀 history inject')
      injectFunction(
        get(window, 'history') as any,
        ['pushState', 'forward', 'replaceState'],
        (...args) => {
          sendMessage_inject('inject-api:onTrigger', {
            args,
            event: 'history',
          })
        },
      )

      History.prototype.pushState = history.pushState
      History.prototype.replaceState = history.replaceState
      History.prototype.forward = history.forward
    } catch (error) {}
  }
} catch (error) {
  console.error(error)
}
