import MiniPlayer from '@root/miniPlayer'
import { sendToBackground } from '@plasmohq/messaging'
import { listen } from '@plasmohq/messaging/message'
import configStore from '@root/store/config'
import AsyncLock from '@root/utils/AsyncLock'
import { wait } from '@root/utils'

let hasClickPage = false,
  isWaiting = false
let clickLock = new AsyncLock()
window.addEventListener('click', () => {
  hasClickPage = true
  clickLock.ok()
})

export type StartPIPPlayOptions = Partial<{ onNeedUserClick: () => void }>
export default abstract class WebProvider {
  miniPlayer: MiniPlayer

  constructor() {
    this.bindToPIPEvent()
    this.bindCommandsEvent()
  }

  /**处理进入画中画的事件，比如复写原本网站的画中画按钮 */
  abstract bindToPIPEvent(): void | Promise<void>

  protected abstract _startPIPPlay(): void | Promise<void>

  async startPIPPlay(options?: StartPIPPlayOptions) {
    await this._startPIPPlay()
  }

  bindCommandsEvent() {
    listen(async (req, res) => {
      if (req.name != 'PIP-action') return
      if (!this.miniPlayer || !this.miniPlayer.videoEl) return
      const { videoEl } = this.miniPlayer
      switch (req?.body) {
        case 'back': {
          videoEl.currentTime -= 5
          break
        }
        case 'forward': {
          videoEl.currentTime += 5
          break
        }
        case 'pause/play': {
          videoEl.paused ? videoEl.play() : videoEl.pause()
          break
        }
        case 'show/hide': {
          document.body.click()
          if (document.pictureInPictureElement) document.exitPictureInPicture()
          // TODO 显示的提示
          // TODO
          // document.pictureInPictureElement
          //   ? document.exitPictureInPicture()
          //   : this.startPIPPlay({
          //       onNeedUserClick: () => {
          //         sendToBackground({ name: 'PIP-need-click-notifications' })
          //       },
          //     })
          break
        }
        case 'playbackRate': {
          videoEl.playbackRate == 1
            ? (videoEl.playbackRate = configStore.playbackRate)
            : (videoEl.playbackRate = 1)
          break
        }
      }
    })
  }
}
