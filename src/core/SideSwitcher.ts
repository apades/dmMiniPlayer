import { VideoList } from '@root/components/VideoPlayer/Side'
import { makeObservable, runInAction } from 'mobx'
import { OrPromise } from '@root/utils/typeUtils'
import { PlayerComponent } from './player-component'

/**
 * 视频侧边栏切换别的视频的
 */
class SideSwitcher implements PlayerComponent<SideSwitcher> {
  readonly __playerComponentKey__ = ['attach'] as const
  videoList: VideoList[] = []

  constructor() {
    makeObservable(this, {
      videoList: true,
    })
  }
  onInit() {}
  onUnload() {}

  attach(): OrPromise<VideoList[]> {
    return []
  }

  init(videoList: VideoList[]) {
    runInAction(() => {
      this.videoList = videoList
    })

    this.onInit()
  }
  unload() {}
}

export { SideSwitcher }
