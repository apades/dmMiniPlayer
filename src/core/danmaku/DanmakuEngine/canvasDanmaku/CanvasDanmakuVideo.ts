import CanvasVideo from '@root/core/CanvasVideo'
import { PlayerEvent } from '@root/core/event'
import CanvasDanmakuEngine from './CanvasDanmakuEngine'
import { runInAction } from 'mobx'

export default class CanvasDanmakuVideo extends CanvasVideo {
  danmakuEngine: CanvasDanmakuEngine

  resizeObserver = new ResizeObserver(([entry]) => {
    const el = entry?.target as HTMLElement
    if (!el || !el.clientWidth || !el.clientHeight) return
    this.updateSize({
      width: el.clientWidth,
      height: el.clientHeight,
    })
  })
  constructor(
    props: ConstructorParameters<typeof CanvasVideo>[0] & {
      danmakuEngine: CanvasDanmakuEngine
    },
  ) {
    super(props)
    this.danmakuEngine = props.danmakuEngine
    // TODO 监听container大小变化，然后调用resize
    // this.danmakuManager.container
    this.resizeObserver.observe(this.danmakuEngine.container)
    const unListenerClose = this.on2(PlayerEvent.close, () => {
      this.resizeObserver.disconnect()
      unListenerClose()
    })
  }
  /**
   * 画布尺寸会被改成小窗尺寸（CanvasPIPWebProvider 的 pip resize），
   * 弹幕引擎的行数上限/起始位置必须按画布尺寸算，不能按网页里播放器元素尺寸算
   */
  override updateSize(option?: { width: number; height: number }) {
    super.updateSize(option)
    const engine = this.danmakuEngine
    if (!engine || !this.width || !this.height) return
    runInAction(() => {
      engine.containerWidth = this.width
      engine.containerHeight = this.height
    })
  }
  override drawCanvas(): void {
    if (!this.canvas.width || !this.canvas.height) return
    if (this.hasSeek) {
      this.danmakuEngine.drawInSeek()
      this.hasSeek = false
      return
    }
    this.danmakuEngine.draw()
  }
}
