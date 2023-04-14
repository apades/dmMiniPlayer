import { waitLoopCallback } from '@root/utils'
import WebProvider from '../webProvider'
import { sendMessage } from '@root/inject/contentSender'
import MiniPlayer from '@root/miniPlayer'
import { DanType } from '@root/danmaku'

export default class BilibiliVideoProvider extends WebProvider {
  regExp = /https:\/\/www.bilibili.com\/video\/.*/
  static regExp = /https:\/\/www.bilibili.com\/video\/.*/

  async bindToPIPEvent() {
    let pipBtn: HTMLElement
    const isPlayInitd = await waitLoopCallback(() => {
      pipBtn = document.getElementsByName(
        'bpx-player-ctrl-pip'
      )[0] as HTMLElement
      return !!pipBtn
    }, 2000)

    // 禁用掉原本的功能
    sendMessage('event-hacker:disable', {
      qs: '.bpx-player-ctrl-pip',
      event: 'click',
    })
    pipBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()

      this._startPIPPlay()
    })
  }
  async _startPIPPlay() {
    if (!this.miniPlayer) {
      this.miniPlayer = new MiniPlayer({
        videoEl: document.querySelector('video'),
        danmu: {
          dans: await this.getDans(),
        },
      })
      this.miniPlayer.startRenderAsCanvas()
      this.miniPlayer.onLeavePictureInPicture = this.miniPlayer.stopRenderAsCanvas
    } else {
      this.miniPlayer.startRenderAsCanvas()
    }

    this.miniPlayer.startCanvasPIPPlay()
  }
  // TODO
  async downloadDanmuFile(): Promise<string> {
    return ''
  }

  // TODO
  transDanmuContentToDans(danmuContent: string): DanType[] {
    return []
  }

  // TODO
  async getDans(): Promise<DanType[]> {
    let danmuContent = await this.downloadDanmuFile()
    let dans = this.transDanmuContentToDans(danmuContent)

    return dans
  }
}
