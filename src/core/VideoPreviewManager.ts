export type VideoPreviewNode = {
  image: string
  timeNodes: number[]
  xSize?: number
  ySize?: number
}

export default class VideoPreviewManager {
  images: string[] = []

  init() {}

  addPreviewData(props: { image: string }) {}

  getPreviewImage(currentTime: number) {}

  unload() {
    this.images = []
  }
}
