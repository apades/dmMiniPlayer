import { sendMessage, onMessage } from '@root/inject/contentSender'
import { windowsOnceCall } from '@root/utils/decorator'
import WebProvider from './webProvider'
import { dq1, wait } from '@root/utils'

export default class DdrkProvider extends WebProvider {
  inPIPPlayMode = false
  constructor() {
    super()
    this.injectHistoryChange()
  }
  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    const miniPlayer = await super.initMiniPlayer(options)

    this.miniPlayer = miniPlayer
    miniPlayer.on('PIPOpen', () => {
      this.inPIPPlayMode = true
    })
    miniPlayer.on('PIPClose', () => {
      this.inPIPPlayMode = false
    })

    return miniPlayer
  }

  @windowsOnceCall('ddrk_history')
  injectHistoryChange() {
    sendMessage('inject-api:run', {
      origin: 'history',
      keys: ['pushState', 'forward', 'replaceState'],
      onTriggerEvent: 'history',
    })
    onMessage('inject-api:onTrigger', (data) => {
      if (data.event != 'history') return null
      console.log('切换了路由 history')
      if (this.inPIPPlayMode) {
        this.clickButtonToAppendSrcInVideoTag()
      }
    })
    window.addEventListener('popstate', () => {
      console.log('切换了路由 popstate')
      if (this.inPIPPlayMode) {
        this.clickButtonToAppendSrcInVideoTag()
      }
    })
  }

  clickButtonToAppendSrcInVideoTag() {
    wait(500).then(() => {
      const btn = dq1('.vjs-big-play-button')
      if (!btn) throw new Error('没有找到按钮')
      btn?.click?.()
    })
  }
}
