import CanvasVideo from '@root/core/CanvasVideo'
import CanvasDanmakuEngine from './CanvasDanmakuEngine'

export default class CanvasDanmakuVideo extends CanvasVideo {
  danmakuManager: CanvasDanmakuEngine

  resizeObserver = new ResizeObserver(([entry]) => {
    const el = entry?.target as HTMLElement
    if (!el) return
    this.updateSize({
      width: el.clientWidth,
      height: el.clientHeight,
    })
  })
  constructor(
    props: ConstructorParameters<typeof CanvasVideo>[0] & {
      danmakuManager: CanvasDanmakuEngine
    }
  ) {
    super(props)
    this.danmakuManager = props.danmakuManager
    // TODO 监听container大小变化，然后调用resize
    // this.danmakuManager.container
    this.resizeObserver.observe(this.danmakuManager.container)
  }
  drawCanvas(): void {
    if (this.hasSeek) {
      this.danmakuManager.drawInSeek()
      this.hasSeek = false
      return
    }
    this.danmakuManager.draw()
  }
}
