import { noop } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { defineClient } from '../../define-client'

export const runCodeClient = defineClient({
  name: 'run-code',
  setup: (ctx) => {
    return {
      async run<T extends noop>(fn: T, args?: any[]): Promise<ReturnType<T>> {
        const res = await ctx.send('run', { function: fn.toString(), args })

        return res
      },
      /**
       * @example example
       *
       * ```js
       * // top window
       * window.eventTar = new EventTarget()
       * ```
       *
       * ```js
       * // adapter code
       * ctx.injection.runWithCallback(
       *  (callback, arg1) => {
       *    console.log(arg1) // print 111 in the top window
       *    window.eventTar.addEventListener('customEvent', callback)
       *    // must return a function to clear the callback
       *    return () => {
       *      window.eventTar.removeEventListener('customEvent', callback)
       *    }
       *  },
       *  // provide callback args
       *  [
       *    function callback(data) {
       *      // handle data in the adapter code window, with data originating from the top window
       *      console.log(data)
       *    },
       *    111
       *  ]
       * )
       * ```
       */
      runWithCallback(
        fn: (...args: any[]) => () => void,
        args?: any[],
      ): () => void {
        const lock = new AsyncLock()
        const id = new Date().getTime()

        const newArgs = args?.map((arg, i) => {
          if (typeof arg == 'function') return { type: 'function', arg: '' }
          return { type: 'normal', arg }
        })
        ctx
          .send('runWithCallback', {
            function: fn.toString(),
            args: newArgs,
            id,
          })
          .then(() => {
            lock.ok()
          })

        const handleOnCallbackRun = (res: any) => {
          const { index, data } = res
          if (res.id != id) return
          args?.[index](...data)
        }
        ctx.on('runWithCallback-callbackRun', handleOnCallbackRun)

        return async () => {
          await lock.waiting()
          ctx.off('runWithCallback-callbackRun', handleOnCallbackRun)
          ctx.send('runWithCallback-clear', { id })
        }
      },
    }
  },
} as const)
