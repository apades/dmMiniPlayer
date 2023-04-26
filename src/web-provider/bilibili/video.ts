import { dq1, onWindowLoad, waitLoopCallback } from '@root/utils'
import WebProvider from '../webProvider'
import { onMessage, sendMessage } from '@root/inject/contentSender'
import MiniPlayer from '@root/miniPlayer'
import { Barrage, DanType } from '@root/danmaku'
import {
  DanmakuDownloadType,
  JsonDanmaku,
  getTextByType,
} from '@root/danmaku/bilibili/barrageDownload/download/utils'
import AssParser from '@root/utils/AssParser'
import configStore from '@root/store/config'
import { DanmakuStack } from '@root/danmaku/bilibili/barrageDownload/converter/danmaku-stack'
import { DanmakuType } from '@root/danmaku/bilibili/barrageDownload/converter/danmaku-type'

export default class BilibiliVideoProvider extends WebProvider {
  regExp = /https:\/\/www.bilibili.com\/video\/.*/
  static regExp = /https:\/\/www.bilibili.com\/video\/.*/

  hasInitDans = false
  constructor() {
    super()

    // TODO history切换url还有点问题，暂时停用
    /* sendMessage('inject-api:run', {
      origin: 'history',
      keys: ['pushState', 'forward', 'replaceState'],
      onTriggerEvent: 'history',
    })
    onMessage('inject-api:onTrigger', (data) => {
      if (data.event != 'history') return null
      this.bindToPIPEvent()
      this.hasInitDans = false
    })
    window.addEventListener('popstate', () => {
      this.bindToPIPEvent()
      this.hasInitDans = false
    }) */

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
    sendMessage('event-hacker:disable', {
      qs: '.bpx-player-ctrl-pip',
      event: 'click',
    })

    sendMessage('event-hacker:listenEventAdd', {
      qs: '.bpx-player-ctrl-pip',
      event: 'click',
    })

    onMessage('event-hacker:onEventAdd', async ({ qs, event }) => {
      if (!(qs == '.bpx-player-ctrl-pip' && event == 'click')) return
      await sendMessage('event-hacker:enable', {
        qs: '.bpx-player-ctrl-pip',
        event: 'click',
      })
      let pipBtn = dq1('.bpx-player-ctrl-pip') as HTMLElement
      pipBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        console.log('click pipBtn')

        this.startPIPPlay()
      })
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

      this.miniPlayer.startRenderAsCanvas()
      this.miniPlayer.onLeavePictureInPicture = () => {
        this.miniPlayer.stopRenderAsCanvas()
        videoEl.pause()
      }
    } else {
      this.miniPlayer.startRenderAsCanvas()
    }

    this.initDans()
    this.miniPlayer.startCanvasPIPPlay()
  }

  initDans() {
    if (this.hasInitDans) return
    this.hasInitDans = true
    this.getDans().then((dans) => {
      this.miniPlayer.danmaku.dans = dans
      this.miniPlayer.danmaku.barrages = dans.map(
        (dan) => new Barrage({ config: dan, player: this.miniPlayer })
      )
    })
  }
  async getDamuContent(
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

  /**
 * 结构
 * ```[{
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
    }]```
 */
  transJsonContentToDans(jsonContent: string): DanType[] {
    let jsonArr = JSON.parse(jsonContent) as JsonDanmaku['jsonDanmakus']
    return jsonArr.map((d) => {
      let type = DanmakuStack.danmakuType[d.mode as DanmakuType]

      return {
        color: '#' + d.color.toString(16),
        text: d.content,
        time: d.progress ? d.progress / 1000 : 0,
        type: type == 'top' ? 'top' : 'right',
      } as DanType
    })
  }

  async getDans(): Promise<DanType[]> {
    let bv = location.pathname.match(/bv(.*?)(\/|\?)/i)?.[1]
    console.log('视频bv', bv)
    // TODO 先不要开启json模式，ass模式有过滤最大弹幕不知道怎么实现的
    let danmuContent = await this.getDamuContent(bv)
    let dans = this.transAssContentToDans(danmuContent)
    // let danmuContent = await this.getDamuContent(bv, 'json')
    // let dans = this.transJsonContentToDans(danmuContent)
    console.log('dans', dans)

    return dans
  }
}
