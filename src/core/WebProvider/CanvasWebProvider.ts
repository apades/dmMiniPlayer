import { WebProvider } from '.'
import SubtitleManager from '../SubtitleManager'
import VideoChanger from '../VideoChanger'
import DanmakuManager from '../danmaku/DanmakuManager'
import CanvasMiniPlayer from '../MiniPlayer/CanvasMiniPlayer'

export default class CanvasWebProvider extends WebProvider {
  onInit(): Partial<{
    videoChanger: VideoChanger
    subtitleManager: SubtitleManager
    danmakuManager: DanmakuManager
  }> {
    throw new Error('Method not implemented.')
  }

  protected miniPlayer: CanvasMiniPlayer

  async openPlayer() {
    super.openPlayer()
  }
}
