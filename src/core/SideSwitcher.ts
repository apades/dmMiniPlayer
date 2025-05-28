import type { VideoList } from '@root/components/VideoPlayer/Side'
import { makeObservable, runInAction } from 'mobx'
import type { PlayerComponent } from './types'

/**
 * 视频侧边栏切换别的视频的
 */
class SideSwitcher implements PlayerComponent {
  videoList: VideoList[] = []

  constructor() {
    makeObservable(this, {
      videoList: true,
    })
  }
  onInit() {}
  onUnload() {}

  init(videoList: VideoList[]) {
    runInAction(() => {
      this.videoList = videoList
    })

    this.onInit()
  }
  unload() {}
}

export { SideSwitcher }
