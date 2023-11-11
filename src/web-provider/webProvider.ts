import { sendToBackground } from '@plasmohq/messaging'
import { listen } from '@plasmohq/messaging/message'
import { getMiniPlayer } from '@root/core'
import VideoChanger from '@root/core/VideoChanger'
import type BarrageClient from '@root/core/danmaku/BarrageClient'
import MiniPlayer from '@root/core/miniPlayer'
import { Barrage } from '@root/danmaku'
import configStore from '@root/store/config'
import vpConfig from '@root/store/vpConfig'
import { dq, dq1 } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import type { OrPromise } from '@root/utils/typeUtils'
import { runInAction } from 'mobx'

let hasClickPage = false,
  isWaiting = false
let clickLock = new AsyncLock()
window.addEventListener('click', () => {
  hasClickPage = true
  clickLock.ok()
})

window.VideoChanger = VideoChanger
export type StartPIPPlayOptions = Partial<{ videoEl: HTMLVideoElement }>
export default abstract class WebProvider {
  miniPlayer?: MiniPlayer
  videoChanger?: VideoChanger
  // barrageClient: BarrageClient
  // abstract isWs: boolean

  constructor() {
    this.bindCommandsEvent()
  }

  protected initMiniPlayer(
    options?: StartPIPPlayOptions
  ): OrPromise<MiniPlayer> {
    const miniPlayer = getMiniPlayer({ videoEl: options.videoEl })
    this.miniPlayer = miniPlayer
    return miniPlayer
  }

  async startPIPPlay(options?: StartPIPPlayOptions) {
    if (document.pictureInPictureElement) return
    this.miniPlayer = await this.initMiniPlayer({
      ...(options ?? {}),
      videoEl: options?.videoEl ?? this.getVideoEl(),
    })
    this.miniPlayer.openPlayer()
    this.miniPlayer.on('PIPClose', () => {
      this.miniPlayer.clearEventListener()
      this.miniPlayer = null
      runInAction(() => {
        vpConfig.reset()
      })
    })
    sendToBackground({ name: 'PIP-active' })
  }

  /**获取视频 */
  getVideoEl(document = window.document): HTMLVideoElement {
    const videos = [
      ...dq('video', document),
      ...dq('iframe', document)
        .map((iframe) => {
          try {
            return Array.from(
              iframe.contentWindow?.document.querySelectorAll('video')
            )
          } catch (error) {
            return null
          }
        })
        .filter((v) => !!v)
        .flat(),
    ]

    if (!videos.length)
      throw Error('页面中不存在video，或者video在不支持的非同源iframe中')
    const targetVideo = videos.reduce((tar, now) => {
      if (tar.clientHeight < now.clientHeight) return now
      return tar
    }, videos[0])

    console.log('targetVideo', targetVideo)
    return targetVideo
  }
  // protected abstract initBarrageSender(): OrPromise<void>

  bindCommandsEvent() {
    listen(async (req, res) => {
      if (req.name != 'PIP-action') return
      if (!this.miniPlayer || !this.miniPlayer.webPlayerVideoEl) return
      const { webPlayerVideoEl: videoEl } = this.miniPlayer
      switch (req?.body) {
        case 'back': {
          videoEl.currentTime -= 5
          break
        }
        case 'forward': {
          videoEl.currentTime += 5
          break
        }
        case 'pause/play': {
          videoEl.paused ? videoEl.play() : videoEl.pause()
          break
        }
        case 'hide': {
          document.body.click()
          if (document.pictureInPictureElement) document.exitPictureInPicture()
          if (window.documentPictureInPicture?.window) {
            window.documentPictureInPicture.window.close()
          }
          // TODO 显示的提示
          // TODO
          // document.pictureInPictureElement
          //   ? document.exitPictureInPicture()
          //   : this.startPIPPlay({
          //       onNeedUserClick: () => {
          //         sendToBackground({ name: 'PIP-need-click-notifications' })
          //       },
          //     })
          break
        }
        case 'playbackRate': {
          videoEl.playbackRate == 1
            ? (videoEl.playbackRate = configStore.playbackRate)
            : (videoEl.playbackRate = 1)
          break
        }
      }
    })
  }

  htmlDanmakuObserver: MutationObserver
  /**监听web的弹幕，这个是下策方法 */
  startObserveHtmlDanmaku(props: {
    container: HTMLElement
    child: string
    text: string
    isDanmu?: (child: HTMLElement) => boolean
  }) {
    this.htmlDanmakuObserver = new MutationObserver((list) => {
      const nodes = list?.[0].addedNodes
      console.log('nodes', nodes)
      if (!nodes)
        return console.warn('发生了未知的错误，找不到list[0].addedNodes', list)

      nodes.forEach((node: HTMLElement) => {
        const isDanmuChild = node.matches(props.child)
        if (!isDanmuChild) return
        const isDanmu = props?.isDanmu?.(node) ?? true
        if (!isDanmu) return
        const text = dq1(props.text, node)?.textContent
        console.log('text', text)
        if (!text) return

        this.miniPlayer.danmakuController.barrages.push(
          new Barrage({
            player: this.miniPlayer,
            config: {
              color: '#fff',
              text,
              time: this.miniPlayer.webPlayerVideoEl.currentTime,
              type: 'right',
            },
          })
        )
      })
    })
    this.htmlDanmakuObserver.observe(props.container, {
      childList: true,
    })
  }

  stopObserveHtmlDanmaku() {
    this.htmlDanmakuObserver.disconnect()
  }
}
