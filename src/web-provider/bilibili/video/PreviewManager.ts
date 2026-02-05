import API_bilibili from '@root/api/bilibili'
import VideoPreviewManager, {
  VideoPreviewData,
} from '@root/core/VideoPreviewManager'
import { createElement, onceCallWithMap, switchLatest } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { OrPromise } from '@root/utils/typeUtils'

export default class BiliBiliPreviewManager extends VideoPreviewManager {
  data: Awaited<ReturnType<typeof API_bilibili.getVideoShot>> | null = null

  asyncLock = new AsyncLock()

  override async onInit() {
    this.asyncLock.reWaiting()
    const data = await API_bilibili.getVideoShot(location.href)
    this.asyncLock.ok()

    this.data = data
  }

  override getPreviewImage = switchLatest(async (currentTime: number) => {
    await this.asyncLock.waiting()
    if (!this.data) throw Error('no init')

    const timeNodes = this.data.timeNodes
    const oneFrameTIme = timeNodes[1] - timeNodes[0]
    const frameIndex = Math.ceil(currentTime / oneFrameTIme)

    const oneImageLength = this.data.xCount * this.data.yCount
    const imageIndex = Math.ceil(frameIndex / oneImageLength) - 1
    const image = this.data.images[imageIndex === -1 ? 0 : imageIndex]

    const realFrameIndex = frameIndex % oneImageLength

    const imageData = await this.getImageFromFrameIndex(image, realFrameIndex)

    // console.log(
    //   '%c ',
    //   `font-size:400px; background:url(${imageData}) no-repeat;`,
    // )
    return {
      image: imageData || '',
      width: this.data.xSize,
      height: this.data.ySize,
    }
  })

  getImageCanvasCtx = onceCallWithMap(async (img: string) => {
    if (!this.data) return
    const canvas = createElement('canvas')
    canvas.width = this.data.xCount * this.data.xSize
    canvas.height = this.data.yCount * this.data.ySize

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imgElement = new Image()
    imgElement.src = img
    imgElement.crossOrigin = 'Anonymous'
    await new Promise((resolve) => {
      imgElement.onload = resolve
    })
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height)

    return ctx
  })

  getImageFromFrameIndex = onceCallWithMap(
    async (img: string, index: number) => {
      if (!this.data) throw Error('no init')
      const ctx = await this.getImageCanvasCtx(img)
      if (!ctx) return

      const x = (index % this.data.xCount) * this.data.xSize
      const y = Math.floor(index / this.data.xCount) * this.data.ySize

      const imageData = ctx.getImageData(x, y, this.data.xSize, this.data.ySize)

      const newCanvas = createElement('canvas')
      newCanvas.width = this.data.xSize
      newCanvas.height = this.data.ySize

      const newCtx = newCanvas.getContext('2d')
      if (!newCtx) return
      newCtx.putImageData(imageData, 0, 0)

      return newCanvas.toDataURL()
    },
  )

  protected override onUnload(): void {
    this.asyncLock.reWaiting()
    this.data = null
  }
}
