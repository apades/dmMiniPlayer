export type Props = {
  videoEl: HTMLVideoElement
  /**默认使用400 */
  renderWidth: number
}

type MustKey = 'videoEl'

export default class MiniPlayer {
  props: Props
  videoStream: MediaStream

  constructor(props: Partial<Omit<Props, MustKey>> & Pick<Props, MustKey>) {
    const { renderWidth = 400, ...otherProps } = props
    this.props = { ...otherProps, renderWidth }

    this.props.videoEl.requestPictureInPicture
  }

  getVideoStream() {
    if (!this.videoStream)
      this.videoStream = (this.props.videoEl as any).captureStream()
    return this.videoStream
  }

  renderAsCanvas() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const video = document.getElementById('video')

    const draw = () => {
      ctx.drawImage(this.props.videoEl, 0, 0, canvas.width, canvas.height)
      requestAnimationFrame(draw)
    }
  }
}
