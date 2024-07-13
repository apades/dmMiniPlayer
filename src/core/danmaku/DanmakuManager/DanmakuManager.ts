import { PlayerComponent } from '@root/core/types'
import Events2 from '@root/utils/Events2'
import { makeKeysObservable } from '@root/utils/mobx'
import {
  Danmaku,
  TunnelManager,
  DanmakuInitData,
  DanmakuManagerEvents,
  HtmlDanmakuManager,
  CanvasDanmakuManager,
} from './'
import configStore from '@root/store/config'

type DanmakuConfig = {
  speed: number
  fontSize: number
  fontFamily: string
  fontWeight: number
  unmovingDanmakuSaveTime: number
  gap: number
}

export type DanmakuManagerInitProps = {
  container?: HTMLElement
  media: HTMLMediaElement
} & Partial<DanmakuConfig>
export default class DanmakuManager
  extends Events2<DanmakuManagerEvents>
  implements DanmakuConfig, PlayerComponent
{
  /**弹幕在实例化时会new这个 */
  Danmaku = Danmaku
  container: Element
  danmakus: Danmaku[] = []

  media: HTMLMediaElement
  tunnelManager = new TunnelManager(this)

  speed = 40
  fontSize = 14
  fontFamily = 'Segoe UI Emoji, SimHei, "microsoft yahei", sans-serif'
  fontWeight = 600
  unmovingDanmakuSaveTime = 5
  gap = 4
  opacity = 1
  fontShadow = true

  // seek + 第一次进入视频时确定startIndex位置
  hasSeek = true
  offsetStartTime = 10

  fps = 60

  visible = true

  constructor() {
    super()
    if (
      [HtmlDanmakuManager, CanvasDanmakuManager].find((v) => this instanceof v)
    ) {
      return this
    }

    makeKeysObservable(this, [
      'speed',
      'fontSize',
      'fontFamily',
      'fontWeight',
      'unmovingDanmakuSaveTime',
      'gap',
      'opacity',
      'fontShadow',
      'fps',
      'visible',
    ])
    if (configStore.useHtmlDanmaku) {
      return new HtmlDanmakuManager()
    } else {
      return new CanvasDanmakuManager()
    }
  }

  changeVisible(visible?: boolean) {
    this.visible = visible ?? !this.visible
  }

  onInit(props: DanmakuManagerInitProps) {}
  onUnload() {}

  unload() {
    this.onUnload()
  }
  init(props: DanmakuManagerInitProps) {
    Object.assign(this, props)
    this.onInit(props)
  }

  runningDanmakus: Danmaku[] = []
  addDanmakus(danmakus: DanmakuInitData[]) {
    this.danmakus.push(
      ...danmakus.map((dan) => {
        return new Danmaku({
          ...dan,
          danmakuManager: this,
        })
      })
    )
  }

  resetState() {
    this.tunnelManager.resetTunnelsMap()
  }
}
