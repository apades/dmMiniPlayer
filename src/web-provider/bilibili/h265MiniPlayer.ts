import MiniPlayer, { Props } from '@root/miniPlayer'
import configStore from '@root/store/config'

export default class H265MiniPlayer extends MiniPlayer {
  videoCanvas: HTMLCanvasElement = null
  constructor(props: Props, canvas: HTMLCanvasElement) {
    super(props)
    this.videoCanvas = canvas
  }
  
  // eslint-disable-next-line prettier/prettier
  override drawImage() {
    console.log('drawImage')
    const width = configStore.renderWidth,
      height = configStore.renderHeight
    this.ctx.drawImage(this.videoCanvas, 0, 0, width, height)
  }
}
