/** */

import MiniPlayer from '@root/miniPlayer'
import WebProvider from './webProvider'

export default class GeneralProvider extends WebProvider {
  observer: MutationObserver

  constructor() {
    super()
  }

  async bindToPIPEvent(): Promise<void> {}
  protected _startPIPPlay(): void | Promise<void> {
    if (!this.miniPlayer) {
      const videoEls = this.getVideoEls()

      // TODO 多个videos的情况
      const videoEl = videoEls[0]
      this.miniPlayer = new MiniPlayer({
        videoEl,
      })

      this.miniPlayer.startRenderAsCanvas()
      this.miniPlayer.onLeavePictureInPicture = () => {
        this.miniPlayer.stopRenderAsCanvas()
        videoEl.pause()
      }
    } else {
      this.miniPlayer.startRenderAsCanvas()
    }

    this.miniPlayer.startCanvasPIPPlay()
  }
}
