import API_bilibili from '@root/api/bilibili'
import VideoPreviewManager from '@root/core/VideoPreviewManager'
import { createElement, onceCallWithMap, switchLatest } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { getVideoInfo } from './utils'

//i.ytimg.com/sb/_LaVvGlkBDs/storyboard3_L$L/$N.jpg?sqp=-oaymwENSDfyq4qpAwVwAcABBqLzl_8DBgizoYbVBQ==|48#27#100#10#10#0#default#rs$AOn4CLAA38Ph1_ymbKlaeU80kIYB4yK1iw|80#45#122#10#10#5000#M$M#rs$AOn4CLAN3OpH57qro3fcfTWavdhucIBTNg|160#90#122#5#5#5000#M$M#rs$AOn4CLAL_qzDlf70Qjr3scobD-5INjMzZQ

export default class YoutubePreviewManager extends VideoPreviewManager {
  data: Awaited<ReturnType<typeof API_bilibili.getVideoShot>> | null = null
  oneFrameTime = 0
  asyncLock = new AsyncLock()

  override async onInit() {
    if (!this.webVideo) return
    this.asyncLock.reWaiting()

    const videoInfo = await getVideoInfo()
    const url: string = videoInfo.storyboards.playerStoryboardSpecRenderer.spec
    const vid = new URLSearchParams(location.search).get('v') || ''
    const sqp = (new URL(url).searchParams.get('sqp') || '').replace(
      /\|.*$/,
      '',
    )

    const a1 = url.split('|')
    const code = a1[a1.length - 1]

    const [width, height, frameCount, cols, rows, ...others] = code.split('#')
    const sigh = others[others.length - 1]

    const duration = this.webVideo.duration
    const fragmentCount = +frameCount / (+cols * +rows),
      fragmentDuration = duration / fragmentCount

    this.oneFrameTime = fragmentDuration / (+cols * +rows)

    this.data = {
      images: new Array(Math.ceil(fragmentCount))
        .fill(null)
        .map(
          (_, i) =>
            `https://i.ytimg.com/sb/${vid}/storyboard3_L${a1.length - 2}/M${i}.jpg?sqp=${sqp}&sigh=${sigh}`,
        ),
      timeNodes: [],
      xCount: +cols,
      yCount: +rows,
      xSize: +width,
      ySize: +height,
    }

    this.asyncLock.ok()
  }

  override getPreviewImage = switchLatest(async (currentTime: number) => {
    await this.asyncLock.waiting()
    if (!this.data) throw Error('no init')

    const frameIndex = Math.ceil(currentTime / this.oneFrameTime)

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
  }
}
