import { dq1, onWindowLoad, waitLoopCallback } from '@root/utils'
import WebProvider from '../webProvider'
import { onMessage, sendMessage } from '@root/inject/contentSender'
import MiniPlayer from '@root/miniPlayer'
import { Barrage, DanType } from '@root/danmaku'
import {
  DanmakuDownloadType,
  getTextByType,
} from '@root/danmaku/bilibili/barrageDownload/download/utils'
import AssParser from '@root/utils/AssParser'
import configStore from '@root/store/config'

export default class BilibiliVideoProvider extends WebProvider {
  regExp = /https:\/\/www.bilibili.com\/video\/.*/
  static regExp = /https:\/\/www.bilibili.com\/video\/.*/

  constructor() {
    super()

    // sendMessage('fetch-hacker:add', /x\/v2\/dm\/web\/seg\.so\?/)
    // TODO 修改messager结构，现在onMessage都需要返回肯定不行
    // onMessage(
    //   'fetch-hacker:onTrigger',
    //   (data) => {
    //     console.log('trigger', data)
    //     return null
    //   },
    //   true
    // )
    // b站的字体
    configStore.fontFamily =
      'SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif'
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
  async _startPIPPlay() {
    if (!this.miniPlayer) {
      let videoEl = document.querySelector('video')
      this.miniPlayer = new MiniPlayer({
        videoEl,
        // danmu: {
        //   dans: await this.getDans(),
        // },
      })

      this.getDans().then((dans) => {
        this.miniPlayer.danmaku.dans = dans
        this.miniPlayer.danmaku.barrages = dans.map(
          (dan) => new Barrage({ config: dan, player: this.miniPlayer })
        )
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
  // TODO type改成json，不要转ass又转json
  /**
 * 结构
 * [{
        "id": 1295126132340998400,
        "progress": 191199,
        "mode": 1,
        "fontsize": 25,
        "color": 16707842,
        "midHash": "66d47db0",
        "content": "ps2才是真正的主机之王。也是老任的第一次吃瘪",
        "ctime": 1681482266,
        "weight": 11,
        "idStr": "1295126132340998400"
    }]
 */
  async getDamuAssContent(
    bid: string,
    type: DanmakuDownloadType = 'ass'
  ): Promise<string> {
    let { aid, cid } = (
      await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bid}`
      ).then((res) => res.json())
    ).data

    return await getTextByType(type, { aid, cid })
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
