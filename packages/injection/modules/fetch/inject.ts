import { defineInject } from '../../define-inject'

export const fetchInject = defineInject({
  name: 'fetch',
  setup: (ctx) => {
    const triggerMap = new Map<
      RegExp,
      (url: string, args: any[], res: any) => void
    >()

    // MARK: 添加监听
    ctx.on('addListen', (reg) => {
      triggerMap.set(reg, (url, args, res) => {
        ctx.send('trigger', { url, args, res })
      })
    })
    ctx.on('removeListen', (reg) => {
      triggerMap.delete(reg)
    })

    // MARK: 重写fetch
    const ofetch = globalThis.fetch
    async function _fetch(...args: any[]) {
      let keys = [...triggerMap.keys()]

      let hasTrigger = keys.find((k) => k.test(args[0]))
      if (!hasTrigger) return ofetch(...(args as [any]))

      // console.log('fetch hacker:onTrigger', hasTrigger)
      let res = await ofetch(...(args as [any]))
      let fn = triggerMap.get(hasTrigger)
      if (!fn) throw new Error('没有找到对应的回调函数')
      try {
        fn(args[0], args, await res.text())
      } catch (error) {
        console.warn(
          `fetch hacker没法触发回调，该地址返回数据的非text`,
          args[0],
        )
        throw new Error('fetch hacker没法触发回调，该地址返回数据的非text')
      }
      globalThis.fetch = _fetch

      return res
    }

    // MARK: 重写XMLHttpRequest
    const oXMLHttpRequest = globalThis.XMLHttpRequest
    globalThis.XMLHttpRequest = class extends oXMLHttpRequest {
      url: string = ''
      method: string = ''
      override open(method: string, url: string | URL): void
      override open(
        method: string,
        url: string | URL,
        async: boolean,
        username?: string,
        password?: string,
      ): void
      override open(...args: any[]): void {
        this.url = args[1]
        this.method = args[0]
        return super.open(...(args as [any, any]))
      }
      override send(body?: Document | XMLHttpRequestBodyInit): void {
        this.addEventListener('load', (res) => {
          const keys = [...triggerMap.keys()]

          const hasTrigger = keys.find((k) => k.test(this.url))
          if (!hasTrigger) return
          let fn = triggerMap.get(hasTrigger)
          if (!fn) throw new Error('没有找到对应的回调函数')
          fn(this.url, [this.method, body], this.responseText)
        })
        return super.send(body)
      }
    }
  },
})
