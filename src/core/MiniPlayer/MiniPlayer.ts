import { minmax, noop } from '@root/utils'
import SubtitleManager from '../SubtitleManager'
import VideoChanger from '../VideoChanger'
import DanmakuManager from '../danmaku/DanmakuManager'
import Events2 from '@root/utils/Events2'
import { PlayerEvent, PlayerEvents } from '../event'
import configStore from '@root/store/config'
import { MaxTunnelType } from '@root/store/config/danmaku'
import { autorun } from 'mobx'
import { PlayerComponent } from '../types'
import { makeKeysObservable } from '@root/utils/mobx'

export type ExtendComponent = {
  videoChanger: VideoChanger
  subtitleManager: SubtitleManager
  danmakuManager: DanmakuManager
}
export type BaseComponent = {
  /**网站的video dom */
  webVideoEl: HTMLVideoElement
}

export type MiniPlayerProps = Partial<ExtendComponent> & BaseComponent

export default abstract class MiniPlayer
  extends Events2<PlayerEvents>
  implements BaseComponent, ExtendComponent, PlayerComponent
{
  webVideoEl: HTMLVideoElement
  videoChanger: VideoChanger
  subtitleManager: SubtitleManager
  danmakuManager: DanmakuManager
  height = 0
  width = 0

  constructor(props: MiniPlayerProps) {
    super()
    Object.assign(this, props)
    makeKeysObservable(this, ['height', 'width'])
    this.init()
  }

  private unlistens: noop[] = []
  private onResize() {
    const { maxTunnel, gap, fontSize } = configStore
    const renderHeight = this.height

    this.danmakuManager.tunnelManager.maxTunnel = (() => {
      switch (maxTunnel) {
        case MaxTunnelType['1/2']:
          return renderHeight / 2 / (+fontSize + +gap)
        case MaxTunnelType['1/4']:
          return renderHeight / 4 / (+fontSize + +gap)
        case MaxTunnelType['full']:
          return 100
      }
    })()
  }

  onUnload() {}
  init() {
    this.onInit()

    console.log('init')
    // 弹幕设置
    const danConfUnlisten = autorun(() => {
      this.danmakuManager.speed = configStore.danSpeed
      this.danmakuManager.unmovingDanmakuSaveTime =
        configStore.danVerticalSafeTime
      this.danmakuManager.opacity = configStore.opacity

      this.danmakuManager.fontWeight = configStore.fontWeight
      this.danmakuManager.fontFamily = configStore.fontFamily
      this.danmakuManager.fontShadow = configStore.fontShadow
      this.danmakuManager.gap = configStore.gap
    })
    // 弹幕大小设置
    const danSizeUnlisten = autorun(() => {
      if (!configStore.adjustFontsizeByPIPWidthResize) {
        this.danmakuManager.fontSize = configStore.fontSize
        return
      }

      // 先计算出目标大小
      const tarSize =
        (configStore.fontSize / configStore.adjustFontsizeStartWidth) *
        this.width *
        configStore.adjustFontsizeScaleRate
      // 再根据最大大小调整
      const clampSize = minmax(
        tarSize,
        configStore.fontSize,
        configStore.adjustFontsizeMaxSize
      )
      this.danmakuManager.fontSize = clampSize
    })

    // 弹幕行设置
    const resizeUnlistens = [
      // this.on2(PlayerEvent.resize, () => {
      //   this.onResize()
      // }),
      autorun(() => {
        this.onResize()
      }),
    ]
    this.unlistens = [danConfUnlisten, danSizeUnlisten, ...resizeUnlistens]

    this.on(PlayerEvent.close, () => {
      this.unload()
      this.unlistens.forEach((unlisten) => unlisten())
      this.danmakuManager.unload()
    })
  }
  unload() {
    this.onUnload()
  }

  onInit() {}
  abstract getPlayerEl(): Promise<HTMLElement>
  abstract getMediaStream(): Promise<MediaStream>
}
