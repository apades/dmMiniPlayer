import { makeAutoObservable, runInAction } from 'mobx'

class VideoRender {
  containerWidth = 0
  containerHeight = 0
  videoWidth = 0
  videoHeight = 0
  x = 0
  y = 0

  constructor() {
    makeAutoObservable(this)
  }

  updateSize(
    videoEl: HTMLVideoElement,
    option?: { width: number; height: number }
  ) {
    // if (!this.videoEl) throw Error('需要设定videoEl')
    if (!option) {
      runInAction(() => {
        this.containerWidth = this.containerWidth || videoEl.clientWidth
        this.containerHeight = this.containerHeight || videoEl.clientHeight
      })
    } else {
      runInAction(() => {
        this.containerWidth = option.width
        this.containerHeight = option.height
      })
    }

    const conWidthToConRatioHeight =
      (this.containerWidth / videoEl.videoWidth) * videoEl.videoHeight
    // 转化比例需要的高度大于目前的高度，转成height为底的模式
    if (conWidthToConRatioHeight > this.containerHeight) {
      const conHeightToConRatioWidth =
        (this.containerHeight / videoEl.videoHeight) * videoEl.videoWidth

      runInAction(() => {
        this.y = 0
        this.x = (this.containerWidth - conHeightToConRatioWidth) / 2
        this.videoHeight = this.containerHeight
        this.videoWidth = conHeightToConRatioWidth
      })
    } else {
      runInAction(() => {
        this.x = 0
        this.y = (this.containerHeight - conWidthToConRatioHeight) / 2
        this.videoWidth = this.containerWidth
        this.videoHeight = conWidthToConRatioHeight
      })
    }
  }
}
const videoRender = new VideoRender()
window.videoRender = videoRender

// observe(videoRender.videoEl, () => {
//   videoRender.setContainerSize()
// })

export default videoRender
