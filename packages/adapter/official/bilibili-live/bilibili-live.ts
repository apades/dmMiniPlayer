import { dq1Adv } from '@root/utils'
import { defineSiteAdapter } from '../../core'
import BilibiliLiveBarrageClient from './bilibili-live-danmaku-client'

export default defineSiteAdapter({
  name: 'bilibili-live',
  match: 'https://live.bilibili.com/*',
  injectPermissions: ['fetch'],
  setup(ctx) {
    ctx.injection.fetch.addListen(/getDanmuInfo/, (data) => {
      if (!data) return
      const info = JSON.parse(data.res)

      window.__danmuInfo = info
    })
  },
  components: {
    DanmakuEngine: {
      attach() {
        const id = +(location.pathname.split('/').pop() ?? 0)
        if (!id) throw Error('不存在的id号')

        return new BilibiliLiveBarrageClient(id, window.__danmuInfo)
      },
    },
    DanmakuSender: {
      attach() {
        return {
          webSendButton:
            dq1Adv<HTMLElement>('.right-actions button') ||
            dq1Adv<HTMLElement>(
              '#chat-control-panel-vm .bottom-actions button',
            )!,
          webTextInput:
            dq1Adv<HTMLInputElement>('.chat-input-new textarea') ||
            dq1Adv<HTMLInputElement>('#chat-control-panel-vm textarea')!,
        }
      },
    },
  },
})
