import MiniPlayer from '@root/miniPlayer'
import WebProvider from './webProvider'
import { DanType } from '@root/danmaku'

export default class OptionProvider extends WebProvider {
  regExp = /https:\/\/www.bilibili.com\/video\/.*/
  static regExp = /https:\/\/www.bilibili.com\/video\/.*/

  constructor(public dans: DanType[] = []) {
    super()

    let videoEl = document.querySelector('video')
    this.miniPlayer = new MiniPlayer({
      videoEl,
      danmu: { dans: this.dans },
    })

    this.miniPlayer.onLeavePictureInPicture = () => {
      this.miniPlayer.stopRenderAsCanvas()
      videoEl.pause()
    }
  }
  async bindToPIPEvent() {}
  async _startPIPPlay() {
    this.miniPlayer.startRenderAsCanvas()
    this.miniPlayer.startCanvasPIPPlay()
  }
}
