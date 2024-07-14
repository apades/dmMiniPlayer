import { WebProvider } from '.'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'

export default class CanvasWebProvider extends WebProvider {
  protected declare miniPlayer: HtmlVideoPlayer

  async openPlayer() {
    super.openPlayer()
  }
}
