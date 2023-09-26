/* eslint-disable prefer-rest-params */
import { onMessage_inject, sendMessage_inject } from './injectListener'

// ? bilibili的/x/v2/dm/web接口还是用的XMLHttpRequest，用不用替换这个
// ---- inject -----
console.log('💀 fetch hacker running')
const ofetch = fetch

const triggerMap: Map<RegExp, (url: string, args: any[], res: any) => void> =
  new Map()

async function _fetch(...args: any[]) {
  let keys = [...triggerMap.keys()]

  let hasTrigger = keys.find((k) => k.test(args[0]))
  if (!hasTrigger) return ofetch.apply(this, arguments)

  // console.log('fetch hacker:onTrigger', hasTrigger)
  let res = await ofetch.apply(this, arguments)
  let fn = triggerMap.get(hasTrigger)
  try {
    fn(args[0], args, await res.text())
  } catch (error) {
    console.warn(`fetch hacker没法触发回调，该地址返回数据的非text`, args[0])
  }

  return res
}

const _XMLHttpRequest = XMLHttpRequest

window.XMLHttpRequest = class extends _XMLHttpRequest {
  url: string
  method: string
  open(method: string, url: string | URL): void
  open(
    method: string,
    url: string | URL,
    async: boolean,
    username?: string,
    password?: string
  ): void
  open(...args: any[]): void {
    this.url = args[1]
    this.method = args[0]
    return super.open(...(args as [any, any]))
  }
  send(body?: Document | XMLHttpRequestBodyInit): void {
    this.addEventListener('load', (res) => {
      const keys = [...triggerMap.keys()]

      const hasTrigger = keys.find((k) => k.test(this.url))
      if (!hasTrigger) return
      let fn = triggerMap.get(hasTrigger)
      fn(this.url, [this.method, body], this.responseText)
    })
    return super.send(body)
  }
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
