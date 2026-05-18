import Events2 from '@root/utils/Events2'
import { OrPromise } from '@root/utils/typeUtils'
import { PlayerComponent } from './player-component'

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

export default class VideoPreviewManager
  extends Events2<{
    unload: void
  }>
  implements PlayerComponent<VideoPreviewManager>
{
  readonly __playerComponentKey__ = ['getPreviewImage'] as const
  webVideo: HTMLVideoElement | null = null
  images: string[] = []

  init(webVideo: HTMLVideoElement) {
    this.unload()
    this.webVideo = webVideo
    this.onInit()
  }

  protected onInit() {}

  addPreviewData(props: { image: string }) {}

  getPreviewImage(currentTime: number): Promise<VideoPreviewData> {
    return Promise.resolve({
      image: '',
      width: 0,
      height: 0,
    })
  }
  unload() {
    this.onUnload()
    this.images = []
    this.webVideo = null
    this.emit('unload')
  }

  protected onUnload() {}
}
