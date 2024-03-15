// TODO 推荐列表 /v1/next?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false

import MiniPlayer, { type MiniPlayerProps } from '@root/core/miniPlayer'
import type { OrPromise } from '@root/utils/typeUtils'
import WebProvider from '../webProvider'
import YoutubeSubtitleManager from './SubtitleManager'

// key位置 ytcfg.data_.INNERTUBE_API_KEY
export default class YoutubeVideoProvider extends WebProvider {
  protected async initMiniPlayer(
    options?: MiniPlayerProps
  ): Promise<MiniPlayer> {
    const subtitleManager = new YoutubeSubtitleManager()
    subtitleManager.init(options?.videoEl ?? this.getVideoEl())
    subtitleManager.initSubtitles()
    this.subtitleManager = subtitleManager

    const miniPlayer = await super.initMiniPlayer({
      ...options,
      subtitleManager,
    })

    return miniPlayer
  }
}
