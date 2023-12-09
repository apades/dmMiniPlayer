import { Barrage, type DanType } from '@root/danmaku'
import BilibiliLiveBarrageClient from '@root/danmaku/bilibili/liveBarrageClient'
import configStore, {
  DocPIPRenderType,
  temporarySetConfigStore,
} from '@root/store/config'
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
import type { Props } from '@root/core/danmaku/BarrageSender'

window.BilibiliLiveBarrageClient = BilibiliLiveBarrageClient
export default class BilibiliLiveProvider extends WebProvider {
  observer: MutationObserver
  barrageClient = new BilibiliLiveBarrageClient()

  constructor() {
    super()
  }

  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ) {
    // b站的iframe video会锁住，需要换模式
    if (options.videoEl.ownerDocument != document) {
      console.warn(
        'b站的iframe videoEl有自己的监听守护，没法把videoEl提取出来，临时切换reactVP_canvasCs模式'
      )
      temporarySetConfigStore(
        'docPIP_renderType',
        DocPIPRenderType.reactVP_canvasCs
      )
    }
    return super.initMiniPlayer(options)
  }

  onInitBarrageSender() {
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

    return {
      webSendButton: dq1Adv('#chat-control-panel-vm .bottom-actions button'),
      webTextInput: dq1Adv(
        '#chat-control-panel-vm textarea'
      ) as HTMLInputElement,
    }
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
          }}
        />
      )
    }

    miniPlayer.renderSideActionArea = () => <Side />
  }
}
