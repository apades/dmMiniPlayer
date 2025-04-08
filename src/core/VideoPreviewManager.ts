import { OrPromise } from '@root/utils/typeUtils'

export type VideoPreviewNode = {
  image: string
  timeNodes: number[]
  xSize?: number
  ySize?: number
}

export type VideoPreviewData = {
  width: number
  height: number
  image: string
}

export default abstract class VideoPreviewManager {
  images: string[] = []

  init() {
    this.onInit()
  }

  protected onInit() {}

  addPreviewData(props: { image: string }) {}

  abstract getPreviewImage(currentTime: number): Promise<VideoPreviewData>
  unload() {
    this.onUnload()
    this.images = []
  }

  protected onUnload() {}
}
