import type { Props } from '@root/core/danmaku/BarrageSender'
import { BilibiliVideoBarrageClient } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import { onMessage, sendMessage } from '@root/inject/contentSender'
import { dq1 } from '@root/utils'
import { windowsOnceCall } from '@root/utils/decorator'
import WebProvider from '../../webProvider'

export default class BilibiliVideoProvider extends WebProvider {
  videoEl: HTMLVideoElement

  constructor() {
    super()
    this.bindPIPActions()
    this.injectHistoryChange()
  }
  @windowsOnceCall('bili_PIPActions')
  bindPIPActions() {
    console.log('bindPIPActions')
    // 这个pip的action按钮在频繁关闭开启中（多数1次）会全部消失，即使是默认b站自己注册的setActionHandler到后面也只剩播放暂停，可能是浏览器问题
    navigator.mediaSession.setActionHandler('pause', (e) => {
      this.videoEl.pause()
      this.miniPlayer.canvasPlayerVideoEl.pause()
      // navigator.mediaSession.playbackState = 'paused'
    })
    navigator.mediaSession.setActionHandler('play', () => {
      this.videoEl.play()
      this.miniPlayer.canvasPlayerVideoEl.play()
      // navigator.mediaSession.playbackState = 'playing'
    })
  }
  @windowsOnceCall('bili_history')
  injectHistoryChange() {
    sendMessage('inject-api:run', {
      origin: 'history',
      keys: ['pushState', 'forward', 'replaceState'],
      onTriggerEvent: 'history',
    })
    onMessage('inject-api:onTrigger', (data) => {
      if (data.event != 'history') return null
      console.log('切换了路由 history')
      if (this.miniPlayer) this.barrageClient.init()
    })
    window.addEventListener('popstate', () => {
      console.log('切换了路由 popstate')
      if (this.miniPlayer) this.barrageClient.init()
    })
  }

  barrageClient = new BilibiliVideoBarrageClient()
  onInitBarrageSender(): Omit<Props, 'textInput'> {
    return {
      webTextInput: dq1('.bpx-player-dm-input'),
      webSendButton: dq1('.bpx-player-dm-btn-send'),
    }
  }
}
