/* eslint-disable prefer-rest-params */
import { onMessage_inject, sendMessage_inject } from './injectListener'

// TODO bilibili的/x/v2/dm/web接口还是用的XMLHttpRequest，需要把这个也给hack了
// ---- inject -----
console.log('💀 fetch hacker running')
let ofetch = fetch

let triggerMap: Map<
  RegExp,
  (url: string, args: any[], res: any) => void
> = new Map()

async function _fetch(...args: any[]) {
  // console.log('fetch hacker:args', ...args)
  let keys = [...triggerMap.keys()]

  let hasTrigger = keys.find((k) => k.test(args[0]))
  if (!hasTrigger) return ofetch.apply(this, arguments)

  // console.log('fetch hacker:onTrigger', hasTrigger)
  let res = await ofetch.apply(this, arguments)
  let fn = triggerMap.get(hasTrigger)
  fn(args[0], args, await res.text())

  return res
}

onMessage_inject('fetch-hacker:add', (reg) => {
  triggerMap.set(reg, (url, args, res) => {
    sendMessage_inject('fetch-hacker:onTrigger', { url, args, res })
  })
})

onMessage_inject('fetch-hacker:remove', (reg) => {
  triggerMap.delete(reg)
})

window.fetch = _fetch
