/* eslint-disable prefer-rest-params */
import { configStringArrValid } from '@root/utils'
import { DEFAULT_FETCH_INJECT_SITE } from '@root/shared/config'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'
import PostMessageEvent from '@root/shared/postMessageEvent'
import isTop from '@root/shared/isTop'
import { onMessage_inject, sendMessage_inject } from './injectListener'

// ? bilibili的/x/v2/dm/web接口还是用的XMLHttpRequest，用不用替换这个
// ---- inject -----

const triggerMap: Map<RegExp, (url: string, args: any[], res: any) => void> =
  new Map()
function main() {
  console.log('💀 fetch hacker running')
  const ofetch = fetch

  async function _fetch(this: any, ...args: any[]) {
    let keys = [...triggerMap.keys()]

    let hasTrigger = keys.find((k) => k.test(args[0]))
    if (!hasTrigger) return ofetch.apply(this, arguments as any)

    // console.log('fetch hacker:onTrigger', hasTrigger)
    let res = await ofetch.apply(this, arguments as any)
    let fn = triggerMap.get(hasTrigger)
    try {
      fn?.(args[0], args, await res.clone().text())
    } catch (error) {
      console.warn(`fetch hacker没法触发回调，该地址返回数据的非text`, args[0])
    }

    return res
  }

  // const _XMLHttpRequest = XMLHttpRequest

  // window.XMLHttpRequest = class extends _XMLHttpRequest {
  //   url: string
  //   method: string
  //   open(method: string, url: string | URL): void
  //   open(
  //     method: string,
  //     url: string | URL,
  //     async: boolean,
  //     username?: string,
  //     password?: string
  //   ): void
  //   open(...args: any[]): void {
  //     this.url = args[1]
  //     this.method = args[0]
  //     return super.open(...(args as [any, any]))
  //   }
  //   send(body?: Document | XMLHttpRequestBodyInit): void {
  //     this.addEventListener('load', (res) => {
  //       const keys = [...triggerMap.keys()]

  //       const hasTrigger = keys.find((k) => k.test(this.url))
  //       if (!hasTrigger) return
  //       let fn = triggerMap.get(hasTrigger)
  //       fn(this.url, [this.method, body], this.responseText)
  //     })
  //     return super.send(body)
  //   }
  // }

  onMessage_inject('fetch-hacker:add', (reg) => {
    triggerMap.set(reg, (url, args, res) => {
      sendMessage_inject('fetch-hacker:onTrigger', { url, args, res })
    })
  })

  onMessage_inject('fetch-hacker:remove', (reg) => {
    triggerMap.delete(reg)
  })

  window.fetch = _fetch
}

if (configStringArrValid(location.href, DEFAULT_FETCH_INJECT_SITE)) {
  main()

  // 懒得管js的运行顺序了，这里直接搞bilibili live ws的修复了
  triggerMap.set(/getDanmuInfo/, async (url, args, res) => {
    if (!url.includes('getDanmuInfo')) return
    window.__danmuInfo = JSON.parse(res)

    if (!isTop) {
      postMessageToTop(PostMessageEvent.asyncData, {
        data: window.__danmuInfo,
        key: '__danmuInfo',
      })
    }
  })
}

onPostMessage(PostMessageEvent.asyncData, ({ data, key }) => {
  window[key] = data
})
