import { Barrage } from '@root/danmaku'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import configStore, { DocPIPRenderType } from '@root/store/config'
import { dq, dq1, onWindowLoad } from '@root/utils'
import WebProvider from '../webProvider'
import { getMiniPlayer } from '@root/core'
import { runInAction } from 'mobx'
import DocMiniPlayer from '@root/core/DocMiniPlayer'
import VideoPlayerSide, {
  type VideoItem,
} from '@root/components/VideoPlayer/Side'
import { useRef, useState } from 'react'
import { useOnce } from '@root/hook'
import API_bilibili from '@root/api/bilibili'

window.BilibiliLiveBarrageClient = BilibiliLiveBarrageClient
export default class BilibiliLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient: BilibiliLiveBarrageClient

  constructor() {
    super()
  }

  private oldDocPIP_renderType: DocPIPRenderType
  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    // b站的iframe video会锁住，需要换模式
    if (options.videoEl.ownerDocument != document) {
      console.warn(
        'b站的iframe videoEl有自己的监听守护，没法把videoEl提取出来，临时切换reactVP_canvasCs模式'
      )
      this.oldDocPIP_renderType = configStore.docPIP_renderType
      configStore.docPIP_renderType = DocPIPRenderType.reactVP_canvasCs
    }
    const miniPlayer = await super.initMiniPlayer(options)

    if (miniPlayer instanceof DocMiniPlayer) {
      this.initSideActionAreaRender(miniPlayer)
    }

    // 弹幕相关
    this.miniPlayer.on('PIPClose', () => {
      this.stopObserveWs()
      if (this.oldDocPIP_renderType) {
        configStore.docPIP_renderType = this.oldDocPIP_renderType
        this.oldDocPIP_renderType = null
      }
    })
    this.startObserverWs()
    function dq1Adv(q: string) {
      const top = dq1(q)
      if (top) {
        return top
      }
      for (const iframe of dq('iframe')) {
        try {
          const child = iframe.contentWindow.document.querySelector(q)
          if (child) return child as HTMLElement
        } catch (error) {}
      }
    }
    this.miniPlayer.initBarrageSender({
      webSendButton: dq1Adv('#chat-control-panel-vm .bottom-actions button'),
      webTextInput: dq1Adv(
        '#chat-control-panel-vm textarea'
      ) as HTMLInputElement,
    })

    return miniPlayer
  }

  private fn: (data: { color: string; text: string }) => void = () => 1
  startObserverWs(id = +location.pathname.split('/').pop()) {
    this.barrageClient = new BilibiliLiveBarrageClient(id)

    this.fn = (data: { color: string; text: string }) => {
      this.miniPlayer.danmakuController.barrages.push(
        new Barrage({
          player: this.miniPlayer,
          config: {
            // TODO
            color: data.color,
            text: data.text,
            time: this.miniPlayer.webPlayerVideoEl.currentTime,
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
    this.barrageClient.close()
  }

  // b站的iframe不给转移videoEl出来...原来不止是
  initSideActionAreaRender(miniPlayer: DocMiniPlayer) {
    if (!configStore.biliLiveSide) return
    const Side = () => {
      const [liveActives, setLiveActives] = useState<VideoItem[]>([])
      const oldWebVideoRef = useRef<HTMLVideoElement>(
        miniPlayer.webPlayerVideoEl
      )

      useOnce(async () => {
        const liveActivesRes = await API_bilibili.getLiveActiveUsers()
        setLiveActives(
          liveActivesRes.map((l) => {
            return {
              el: null,
              link: l.link,
              linkEl: null,
              title: l.title,
              user: l.user,
              cover: l.cover,
              id: l.roomid + '',
            }
          })
        )
      })

      return (
        <VideoPlayerSide
          videoList={[
            {
              category: '正在直播',
              isSpa: false,
              items: liveActives,
            },
          ]}
          webProvider={this}
          onChange={(item) => {
            oldWebVideoRef.current.pause()
            oldWebVideoRef.current = miniPlayer.webPlayerVideoEl
            this.stopObserveWs()
            miniPlayer.danmakuController.initDans([])
            this.startObserverWs(+item.id)
          }}
        />
      )
    }

    miniPlayer.renderSideActionArea = () => <Side />
  }
}
