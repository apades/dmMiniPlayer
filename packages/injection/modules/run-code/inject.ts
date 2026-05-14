import { defineInject } from '../../define-inject'

export const runCodeInject = defineInject({
  name: 'run-code',
  setup: (ctx) => {
    async function run(data: { function: string; args: any[] }) {
      const fn = new Function(`return (${data.function})(...arguments)`)

      return await fn(...(data.args ?? []))
    }

    async function runWithCallback(data: {
      function: string
      args: any[]
      id: number
    }) {
      const fn = new Function(`return (${data.function})(...arguments)`)

      const args = (data.args ?? []).map((arg, index) => {
        if (arg.type == 'normal') return arg.arg
        if (arg.type == 'function')
          return (...args: any[]) => {
            ctx.send('runWithCallback-callbackRun', {
              index,
              data: args,
              id: data.id,
            })
          }
      })

      const clearCallback = await fn(...args)

      const handleClearRunWithCallback = ({ id }: any) => {
        if (id != data.id) return
        clearCallback()
        ctx.off('runWithCallback-clear', handleClearRunWithCallback)
      }
      ctx.on('runWithCallback-clear', handleClearRunWithCallback)
    }

    ctx.on('run', async (data) => {
      return await run(data)
    })

    ctx.on('runWithCallback', async (data) => {
      return await runWithCallback(data)
    })
  },
})
