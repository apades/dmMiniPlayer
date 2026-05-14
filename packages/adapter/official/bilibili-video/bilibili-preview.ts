import { PlayerComponentsConfig } from '@root/core/player-component'
import { createElement, onceCallWithMap } from '@root/utils'
import { getVideoInfoFromUrl } from './bilibili-helpers'

const getVideoShot = onceCallWithMap(async (url: string) => {
  const { aid, cid } = await getVideoInfoFromUrl(url)

  const res = (
    await fetch(
      `https://api.bilibili.com/x/player/videoshot?aid=${aid}&cid=${cid}`,
    ).then((res) => res.json())
  ).data

  const binaryData = await fetch(res.pvdata).then((res) => res.arrayBuffer())
  const uint16Array = new Uint8Array(binaryData)

  const timeNodes: number[] = []
  for (let i = 0; i < uint16Array.length; i += 2) {
    const timeNode = uint16Array[i] * 100 + uint16Array[i + 1]

    timeNodes.push(timeNode)
  }

  // 第一个是0，可以去掉
  timeNodes.shift()

  return {
    images: res.image as string[],
    xCount: res.img_x_len as number,
    yCount: res.img_y_len as number,
    xSize: res.img_x_size as number,
    ySize: res.img_y_size as number,
    timeNodes,
  }
})

const getImageFromFrameIndex = onceCallWithMap(
  async (img: string, index: number) => {
    if (!data) throw Error('no init')
    const ctx = await getImageCanvasCtx(img)
    if (!ctx) return

    const x = (index % data.xCount) * data.xSize
    const y = Math.floor(index / data.xCount) * data.ySize

    const imageData = ctx.getImageData(x, y, data.xSize, data.ySize)

    const newCanvas = createElement('canvas')
    newCanvas.width = data.xSize
    newCanvas.height = data.ySize

    const newCtx = newCanvas.getContext('2d')
    if (!newCtx) return
    newCtx.putImageData(imageData, 0, 0)

    return newCanvas.toDataURL()
  },
)

const getImageCanvasCtx = onceCallWithMap(async (img: string) => {
  if (!data) return
  const canvas = createElement('canvas')
  canvas.width = data.xCount * data.xSize
  canvas.height = data.yCount * data.ySize

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

let data: Awaited<ReturnType<typeof getVideoShot>> | null = null

export const PreviewManager: PlayerComponentsConfig['VideoPreviewManager'] = {
  async getPreviewImage(currentTime) {
    data = await getVideoShot(location.href)

    const timeNodes = data.timeNodes
    const oneFrameTIme = timeNodes[1] - timeNodes[0]
    const frameIndex = Math.ceil(currentTime / oneFrameTIme)

    const oneImageLength = data.xCount * data.yCount
    const imageIndex = Math.ceil(frameIndex / oneImageLength) - 1
    const image = data.images[imageIndex === -1 ? 0 : imageIndex]

    const realFrameIndex = frameIndex % oneImageLength

    const imageData = await getImageFromFrameIndex(image, realFrameIndex)

    return {
      image: imageData || '',
      width: data.xSize,
      height: data.ySize,
    }
  },
}

export const onMediaUpdated = () => {
  getImageCanvasCtx.clear()
  getVideoShot.clear()
  getImageFromFrameIndex.clear()
  data = null
}
