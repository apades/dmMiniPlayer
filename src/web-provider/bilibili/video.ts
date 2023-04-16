import { dq1, onWindowLoad, waitLoopCallback } from '@root/utils'
import WebProvider from '../webProvider'
import { sendMessage } from '@root/inject/contentSender'
import MiniPlayer from '@root/miniPlayer'
import { DanType } from '@root/danmaku'
import { getTextByType } from '@root/danmaku/bilibili/download/utils'
import AssParser from '@root/utils/AssParser'

export default class BilibiliVideoProvider extends WebProvider {
  regExp = /https:\/\/www.bilibili.com\/video\/.*/
  static regExp = /https:\/\/www.bilibili.com\/video\/.*/

  constructor() {
    super()
  }
  async bindToPIPEvent() {
    // await onWindowLoad()
    let pipBtn: HTMLElement
    const isPlayInitd = await waitLoopCallback(() => {
      pipBtn = dq1('.bpx-player-ctrl-pip') as HTMLElement
      return !!pipBtn
    }, 10000)

    console.log('pipBtn', pipBtn)
    if (!pipBtn) throw new Error('没有找到bilibili的画中画按钮')
    // 禁用掉原本的功能
    sendMessage('event-hacker:disable', {
      qs: '.bpx-player-ctrl-pip',
      event: 'click',
    })
    pipBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      console.log('click pipBtn')

      this.startPIPPlay()
    })
  }
  // TODO 现在是打开需要一段时间loading弹幕，需要替换icon loading或者什么表示下
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
  async getDamuAssContent(bid: string): Promise<string> {
    let { aid, cid } = (
      await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bid}`
      ).then((res) => res.json())
    ).data

    return await getTextByType('ass', { aid, cid })
  }

  transAssContentToDans(assContent: string): DanType[] {
    let parser = new AssParser(assContent)
    return parser.dans
  }

  async getDans(): Promise<DanType[]> {
    let bv = location.pathname.match(/bv(.*?)(\/|\?)/i)?.[1]
    console.log('视频bv', bv)
    let danmuContent = await this.getDamuAssContent(bv)
    let dans = this.transAssContentToDans(danmuContent)

    return dans
  }
}
