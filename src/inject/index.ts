import { onMessage_inject } from './injectListener'

onMessage_inject('run-code', async (data) => {
  let fn = new Function(data.code)

  return await fn()
})
