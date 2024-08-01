import { minmax } from '@root/utils'
import { autorun, makeAutoObservable, runInAction } from 'mobx'
import configStore from './config'

class VideoRender {
  containerWidth = 0
  containerHeight = 0
  videoWidth = 0
  videoHeight = 0
  x = 0
  y = 0

  /**实际的fontSize，因为有自动调整大小的影响所以放在独立于config之外的config上了 */
  fontSize = 0
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
        this.containerWidth = videoEl.clientWidth * window.devicePixelRatio
        this.containerHeight = videoEl.clientHeight * window.devicePixelRatio
      })
    } else {
      runInAction(() => {
        this.containerWidth = option.width * window.devicePixelRatio
        this.containerHeight = option.height * window.devicePixelRatio
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

autorun(() => {
  if (!configStore.adjustFontsizeByPIPWidthResize) {
    videoRender.fontSize = configStore.fontSize
    return
  }
  const tarSize =
    (configStore.fontSize / configStore.adjustFontsizeStartWidth) *
    videoRender.containerWidth *
    configStore.adjustFontsizeScaleRate
  const clampSize = minmax(
    tarSize,
    configStore.fontSize,
    configStore.adjustFontsizeMaxSize
  )

  videoRender.fontSize = clampSize
})

export default videoRender
