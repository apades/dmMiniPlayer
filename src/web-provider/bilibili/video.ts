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

  videoEl: HTMLVideoElement
  constructor() {
    super()

    // TODO history切换url还有点问题，暂时停用
    sendMessage('inject-api:run', {
      origin: 'history',
      keys: ['pushState', 'forward', 'replaceState'],
      onTriggerEvent: 'history',
    })
    onMessage('inject-api:onTrigger', (data) => {
      if (data.event != 'history') return null
      console.log('切换了路由 history')
      this.bindToPIPEvent()
      if (this.miniPlayer) this.initDans()
    })
    window.addEventListener('popstate', () => {
      console.log('切换了路由 popstate')
      this.bindToPIPEvent()
      if (this.miniPlayer) this.initDans()
    })

    // b站的字体
    configStore.fontFamily =
      'SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif'

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
  async bindToPIPEvent() {
    sendMessage('event-hacker:disable', {
      qs: '.bpx-player-ctrl-pip',
      event: 'click',
    })
  }
  bindPIPActions() {
    console.log('bindPIPActions')
    // 这个pip的action按钮在频繁关闭开启中（多数1次）会全部消失，即使是默认b站自己注册的setActionHandler到后面也只剩播放暂停，可能是浏览器问题
    navigator.mediaSession.setActionHandler('pause', (e) => {
      this.videoEl.pause()
      this.miniPlayer.playerVideoEl.pause()
      // navigator.mediaSession.playbackState = 'paused'
    })
    navigator.mediaSession.setActionHandler('play', () => {
      this.videoEl.play()
      this.miniPlayer.playerVideoEl.play()
      // navigator.mediaSession.playbackState = 'playing'
    })
  }
  async _startPIPPlay() {
    if (!this.miniPlayer) {
      let videoEl = document.querySelector('video')
      this.videoEl = videoEl
      this.miniPlayer = new MiniPlayer({
        videoEl,
      })

      this.bindPIPActions()
      this.miniPlayer.startRenderAsCanvas()
      this.miniPlayer.onLeavePictureInPicture = () => {
        this.miniPlayer.stopRenderAsCanvas()
        videoEl.pause()
      }
    } else {
      this.miniPlayer.playerVideoEl.play()
      this.miniPlayer.startRenderAsCanvas()
    }

    this.initDans()
    this.miniPlayer.startCanvasPIPPlay()
  }

  initDans() {
    this.getDans().then((dans) => this.miniPlayer.danmaku.initDans(dans))
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
