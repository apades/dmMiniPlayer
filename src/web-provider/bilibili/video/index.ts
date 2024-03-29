import DocMiniPlayer from '@root/core/DocMiniPlayer'
import type MiniPlayer from '@root/core/miniPlayer'
import type { DanType } from '@root/danmaku'
import { DanmakuStack } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/converter/danmaku-stack'
import type { DanmakuType } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/converter/danmaku-type'
import {
  JsonDanmaku,
  getTextByType,
  type DanmakuDownloadType,
} from '@root/danmaku/bilibili/videoBarrageClient/bilibili-evaolved/download/utils'
import { onMessage, sendMessage } from '@root/inject/contentSender'
import configStore from '@root/store/config'
import { dq1 } from '@root/utils'
import AssParser from '@root/utils/AssParser'
import { windowsOnceCall } from '@root/utils/decorator'
import type { OrPromise } from '@root/utils/typeUtils'
import { getBiliBiliVideoDanmu } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import WebProvider from '../../webProvider'
import { initSideActionAreaRender } from './sider'
import AsyncLock from '@root/utils/AsyncLock'
import { runInAction } from 'mobx'
import vpConfig from '@root/store/vpConfig'
import { getBv, getPid } from '../utils'
import BilibiliSubtitleManager from './SubtitleManager'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import type { MiniPlayerProps } from '@root/core/miniPlayer'

export default class BilibiliVideoProvider extends WebProvider {
  videoEl: HTMLVideoElement
  declare subtitleManager: BilibiliSubtitleManager

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
    onRouteChange(() => {
      this.initDans()
      if (this.subtitleManager) {
        this.subtitleManager.initSubtitles()
      }
    })
  }

  protected async initMiniPlayer(
    options?: MiniPlayerProps
  ): Promise<MiniPlayer> {
    const subtitleManager = new BilibiliSubtitleManager()
    subtitleManager.init(options?.videoEl ?? this.getVideoEl())
    subtitleManager.initSubtitles()
    this.subtitleManager = subtitleManager

    const miniPlayer = await super.initMiniPlayer({
      ...options,
      subtitleManager,
    })
    this.videoEl = this.miniPlayer.webPlayerVideoEl

    if (miniPlayer instanceof DocMiniPlayer) {
      initSideActionAreaRender(miniPlayer, this)
    }
    this.initDans()
    miniPlayer.initBarrageSender({
      webTextInput: dq1('.bpx-player-dm-input'),
      webSendButton: dq1('.bpx-player-dm-btn-send'),
    })
    return miniPlayer
  }

  initDans() {
    runInAction(() => {
      vpConfig.canShowBarrage = true
    })
    this.getDans().then((dans) =>
      this.miniPlayer.danmakuController.initDans(dans)
    )
  }

  async getVideoInfo(bid: string, pid = 1) {
    this.aidLock.reWaiting()
    let res = (
      await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bid}`
      ).then((res) => res.json())
    ).data
    let { aid, cid, pages } = res

    if (pid != 1) {
      try {
        cid = pages[pid - 1].cid
      } catch (error) {
        console.error('出现了pid/pages不存在的问题', res, pid)
      }
    }
    this.aid = aid
    this.aidLock.ok()

    return { aid, cid }
  }

  async getDamuContent(
    aid: string,
    cid: string,
    type: DanmakuDownloadType = 'ass'
  ): Promise<string> {
    return await getTextByType(type, { aid, cid })
  }
  private aidLock = new AsyncLock()
  private aid = ''
  /**获取当前视频的aid */
  async getAid() {
    await this.aidLock.waiting()
    return this.aid
  }

  transAssContentToDans(assContent: string): DanType[] {
    let parser = new AssParser(assContent)
    return parser.dans
  }

  transJsonContentToDans(jsonContent: string): DanType[] {
    let jsonArr = JSON.parse(jsonContent) as JsonDanmaku['jsonDanmakus']
    return jsonArr.map((d) => {
      let type = DanmakuStack.danmakuType[d.mode as DanmakuType]

      return {
        color: '#' + d.color.toString(16),
        text: d.content,
        time: d.progress ? d.progress / 1000 : 0,
        type: type == 'top' ? 'top' : 'right',
      } as DanType
    })
  }

  async getDans(): Promise<DanType[]> {
    let bv = getBv(),
      pid = getPid()
    console.log('视频bv+ pid', bv, pid)

    const { aid, cid } = await this.getVideoInfo(bv, pid)

    if (configStore.biliVideoDansFromBiliEvaolved) {
      // 这里是旧的bilibili-evaolved获取逻辑
      // ass模式有过滤最大弹幕不知道怎么实现的
      let danmuContent = await this.getDamuContent(
        aid,
        cid,
        configStore.biliVideoPakkuFilter ? 'ass' : 'originJson'
      )

      if (configStore.biliVideoPakkuFilter) {
        return this.transAssContentToDans(danmuContent)
      } else {
        return this.transJsonContentToDans(danmuContent)
      }
    } else {
      return getBiliBiliVideoDanmu(cid)
    }
  }
}
