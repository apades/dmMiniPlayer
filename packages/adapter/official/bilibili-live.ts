import { onMessage, sendMessage } from '@root/inject/contentSender'
import { tryCatch } from '@root/utils'
import { defineSiteAdapter } from '../core'

export default defineSiteAdapter({
  name: 'bilibili-live',
  injectPermissions: ['fetch'],
  setup() {
    sendMessage('fetch-hacker:add', /getDanmuInfo/)
    onMessage('fetch-hacker:onTrigger', (data) => {
      if (!data) return
      const info = JSON.parse(data.res)

      window.__danmuInfo = info
    })
  },
})
