import Events2 from '@root/utils/Events2'
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

export default abstract class VideoPreviewManager extends Events2<{
  unload: void
}> {
  webVideo: HTMLVideoElement | null = null
  images: string[] = []

  init(webVideo: HTMLVideoElement) {
    this.unload()
    this.webVideo = webVideo
    this.onInit()
  }

  protected onInit() {}

  addPreviewData(props: { image: string }) {}

  abstract getPreviewImage(currentTime: number): Promise<VideoPreviewData>
  unload() {
    this.onUnload()
    this.images = []
    this.webVideo = null
    this.emit('unload')
  }

  protected onUnload() {}
}
