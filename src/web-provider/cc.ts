import { Barrage } from '@root/danmaku'
import MiniPlayer from '@root/miniPlayer'
import configStore from '@root/store/config'
import { dq1, onWindowLoad } from '@root/utils'
import WebProvider from './webProvider'
import CCLiveBarrageClient from '@root/danmaku/cc/liveBarrageClient'

window.CCLiveBarrageClient = CCLiveBarrageClient
export default class CCLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient: CCLiveBarrageClient

  constructor() {
    super()

    // TODO cc的弹幕字体
    // // 斗鱼的字体
    configStore.fontFamily =
      'PingFang SC,-apple-system,Microsoft YaHei,宋体,Arial,Verdana'
    configStore.fontWeight = 700
  }

  async bindToPIPEvent(): Promise<void> {}
  protected _startPIPPlay(): void | Promise<void> {
    if (!this.miniPlayer) {
      let videoEl =
        document.querySelector('video') ||
        (document.getElementById(
          'liveIframe'
        ) as HTMLIFrameElement)?.contentWindow?.document?.querySelector?.(
          'video'
        )

      // console.log('videoEl', videoEl, document.querySelector('video'))
      this.miniPlayer = new MiniPlayer({
        videoEl,
      })

      this.miniPlayer.startRenderAsCanvas()
      this.miniPlayer.onLeavePictureInPicture = () => {
        this.miniPlayer.stopRenderAsCanvas()
        // this.stopObserveHtmlDanmaku()
        this.stopObserveWs()
      }
    } else {
      this.miniPlayer.startRenderAsCanvas()
    }

    // FIXME 我真搞不懂为什么就cc报错 Must be handling a user gesture if there isn't already an element in Picture-in-Picture.
    // navigator.mediaSession.setActionHandler('pause', (e) => {
    //   console.log('pause')
    // })
    // navigator.mediaSession.setActionHandler('play', () => {
    //   console.log('play')
    // })

    // this.startObserveHtmlDanmaku()
    this.startObserverWs()
    this.miniPlayer.startCanvasPIPPlay()
  }

  stopObserveHtmlDanmaku() {
    this.observer.disconnect()
  }

  private fn: (data: { color: string; text: string }) => void = () => 1
  startObserverWs() {
    if (!this.barrageClient) {
      const pathArr = location.pathname.split('/')
      pathArr.pop()
      this.barrageClient = new CCLiveBarrageClient(+pathArr.pop())
    }

    this.fn = (data: { color: string; text: string }) => {
      this.miniPlayer.danmaku.barrages.push(
        new Barrage({
          player: this.miniPlayer,
          config: {
            // TODO
            color: data.color,
            text: data.text,
            time: this.miniPlayer.videoEl.currentTime,
            // TODO
            type: 'right',
          },
        })
      )
    }
    this.barrageClient.addEventListener('danmu', this.fn)
  }
  stopObserveWs() {
    this.barrageClient.removeListener('danmu', this.fn)
  }
}
