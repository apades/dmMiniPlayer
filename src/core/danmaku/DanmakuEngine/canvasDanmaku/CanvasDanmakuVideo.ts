import CanvasVideo from '@root/core/CanvasVideo'
import CanvasDanmakuEngine from './CanvasDanmakuEngine'
import { PlayerEvent } from '@root/core/event'

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
  drawCanvas(): void {
    if (!this.canvas.width || !this.canvas.height) return
    if (this.hasSeek) {
      this.danmakuEngine.drawInSeek()
      this.hasSeek = false
      return
    }
    this.danmakuEngine.draw()
  }
}
