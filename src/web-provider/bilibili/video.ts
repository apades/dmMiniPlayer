import { waitLoopCallback } from '@root/utils'
import WebProvider from '../webProvider'
import { sendMessage } from '@root/inject/contentSender'
import MiniPlayer from '@root/miniPlayer'
import { DanType } from '@root/danmaku'
import { getBlobByType } from '@root/danmaku/bilibili/download/utils'

export default class BilibiliVideoProvider extends WebProvider {
  regExp = /https:\/\/www.bilibili.com\/video\/.*/
  static regExp = /https:\/\/www.bilibili.com\/video\/.*/

  constructor() {
    super()
  }
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
      let videoEl = document.querySelector('video')
      this.miniPlayer = new MiniPlayer({
        videoEl,
        danmu: {
          dans: await this.getDans(),
        },
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
  // TODO
  async downloadDanmuFile(bid: string): Promise<string> {
    let { aid, cid } = (
      await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bid}`
      ).then((res) => res.json())
    ).data

    let blob = await getBlobByType('ass', { aid, cid })
    console.log('blob', blob)
    return ''
  }

  // TODO
  transDanmuContentToDans(danmuContent: string): DanType[] {
    return []
  }

  // TODO
  async getDans(): Promise<DanType[]> {
    let danmuContent = await this.downloadDanmuFile('')
    let dans = this.transDanmuContentToDans(danmuContent)

    return dans
  }
}
