import DocMiniPlayer from '@root/core/DocMiniPlayer'
import type MiniPlayer from '@root/core/miniPlayer'
import type { MiniPlayerProps } from '@root/core/miniPlayer'
import type { DanType } from '@root/danmaku'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import vpConfig from '@root/store/vpConfig'
import { dq1, onceCall } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { windowsOnceCall } from '@root/utils/decorator'
import { runInAction } from 'mobx'
import WebProvider from '../../webProvider'
import { getDanmakus as _getDanmakus, getVideoInfoFromUrl } from '../utils'
import BilibiliSubtitleManager from './SubtitleManager'
import { initSideActionAreaRender } from './sider'

const getDanmakus = onceCall(_getDanmakus)
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
      vpConfig.canShowDanmaku = true
    })
    this.getDans().then((dans) =>
      this.miniPlayer.danmakuController.addDanmakus(dans)
    )
  }

  private aidLock = new AsyncLock()
  private aid = ''
  /**获取当前视频的aid */
  async getAid() {
    await this.aidLock.waiting()
    return this.aid
  }

  async getDans(): Promise<DanType[]> {
    this.aidLock.reWaiting()
    const { aid, cid } = await getVideoInfoFromUrl(location.href)
    this.aid = aid
    const danmakus = await getDanmakus(aid, cid)
    return danmakus
  }
}
