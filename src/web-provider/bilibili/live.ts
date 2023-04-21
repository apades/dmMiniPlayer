import { dq1, onWindowLoad } from '@root/utils'
import WebProvider from '../webProvider'
import { sendMessage } from '@root/inject/contentSender'
import { Barrage } from '@root/danmaku'
import MiniPlayer from '@root/miniPlayer'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import configStore from '@root/store/config'

window.BilibiliLiveBarrageClient = BilibiliLiveBarrageClient
export default class BilibiliLiveProvider extends WebProvider {
  regExp = /https:\/\/live.bilibili.com\/.*/
  static regExp = /https:\/\/live.bilibili.com\/.*/

  observer: MutationObserver
  barrageClient: BilibiliLiveBarrageClient

  constructor() {
    super()

    // b站的字体
    configStore.fontFamily =
      'SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif'
  }

  async bindToPIPEvent(): Promise<void> {
    await onWindowLoad()
    // function getPIPButtonInParent(el: HTMLElement, TTL = 5): HTMLElement {
    //   if (TTL-- || el == null) return null
    //   if (el.classList.contains('icon')) return el
    //   return getPIPButtonInParent(el.parentElement, TTL)
    // }
    // let pipSvg = dq1('#画中画icon'),
    //   pipBtn = getPIPButtonInParent(pipSvg)
    // sendMessage('event-hacker:disable', {
    //   qs: '.' + [...pipBtn.classList].join('.'),
    //   event: 'click',
    // })
    window.addEventListener(
      'click',
      (e) => {
        let target = e.target as HTMLElement
        if (target.querySelector('#画中画icon')) {
          console.log('画中画')
          e.preventDefault()
          e.stopImmediatePropagation()
          e.stopPropagation()
          this.startPIPPlay()
        }
      },
      false
    )
    window.addEventListener(
      'click',
      (e) => {
        let target = e.target as HTMLElement
        if (target.querySelector('#画中画icon')) {
          console.log('画中画')
          e.preventDefault()
          e.stopImmediatePropagation()
          e.stopPropagation()
          this.startPIPPlay()
        }
      },
      true
    )
    // pipBtn.addEventListener('click', (e) => {
    //   e.stopPropagation()
    //   e.preventDefault()
    //   console.log('click pipBtn')
    //   this.startPIPPlay()
    // })
  }
  protected _startPIPPlay(): void | Promise<void> {
    if (!this.miniPlayer) {
      let videoEl = document.querySelector('video')
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

    // this.startObserveHtmlDanmaku()
    this.startObserverWs()
    this.miniPlayer.startCanvasPIPPlay()
  }

  // web模式没法知道颜色
  startObserveHtmlDanmaku() {
    this.observer = new MutationObserver((list) => {
      let nodes = list?.[0].addedNodes
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((node: HTMLElement) => {
        let isDanmu = node.classList.contains('danmaku-item')
        if (!isDanmu) return
        this.miniPlayer.danmaku.barrages.push(
          new Barrage({
            player: this.miniPlayer,
            config: {
              color: '#fff',
              text: node.dataset.danmaku,
              time: this.miniPlayer.videoEl.currentTime,
              type: 'right',
            },
          })
        )
      })
    })
    this.observer.observe(dq1('.chat-items'), {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.observer.disconnect()
  }

  private fn: (data: { color: string; text: string }) => void = () => 1
  startObserverWs() {
    if (!this.barrageClient)
      this.barrageClient = new BilibiliLiveBarrageClient(
        +location.pathname.split('/').pop()
      )

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
