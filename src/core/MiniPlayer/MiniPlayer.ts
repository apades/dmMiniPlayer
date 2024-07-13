import Events2 from '@root/utils/Events2'
import { makeKeysObservable } from '@root/utils/mobx'
import SubtitleManager from '../SubtitleManager'
import VideoChanger from '../VideoChanger'
import DanmakuManager from '../danmaku/DanmakuManager'
import { PlayerEvent, PlayerEvents } from '../event'
import { PlayerComponent } from '../types'

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
    this.init()
  }

  onUnload() {}
  init() {
    this.onInit()

    // 弹幕行设置
    this.on(PlayerEvent.close, () => {
      this.unload()
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
