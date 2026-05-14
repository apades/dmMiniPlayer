import { isString, noop } from '@root/utils'
import { defineClient } from '../../define-client'

export const fetchClient = defineClient({
  name: 'fetch',
  setup: (ctx) => {
    let callbackMap = new Map()

    function addListen(
      reg: RegExp | string,
      callback: (res: { url: string; args: any[]; res: string }) => void,
    ) {
      callbackMap.set(reg + '', callback)
      const regex = isString(reg) ? new RegExp(reg) : reg

      ctx.send('addListen', regex)
      ctx.on('trigger', callback as noop)

      return () => removeListen(reg)
    }
    function removeListen(reg: RegExp | string) {
      const callback = callbackMap.get(reg + '')
      if (!callback) return console.log('没有需要移除的callback')

      ctx.send('removeListen', callback)
      ctx.off('trigger', callback as noop)
    }

    return {
      addListen,
      removeListen,
    }
  },
})
