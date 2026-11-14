import cookie from '@pkgs/js-cookie'
import API_bilibili from '@root/api/bilibili'
import BarrageClient from '@root/core/danmaku/BarrageClient'
import {
  sendMessage,
  onMessage,
  runCodeInTopWindow,
} from '@root/inject/contentSender'
import { tryCatch } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { LiveWS, LiveTCP, KeepLiveWS, KeepLiveTCP } from 'bilibili-live-ws'

export const proto = {
  nested: {
    DMLiveReply: {},
  },
}

const getRoomid = async (short: number) => {
  const {
    data: { room_id },
  } = await fetch(
    `https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=${short}`,
  ).then((w) => w.json())
  return room_id
}

export const getConf = async (roomid: number) => {
  const raw = await runCodeInTopWindow(() => window.__danmuInfo)
  const {
    data: {
      token: key,
      host_list: [{ host, wss_port: port }],
    },
  } = raw
  const address = `wss://${host}/sub`
  return { key, host, port, address, raw }
}

export default class BilibiliLiveBarrageClient extends BarrageClient {
  ws?: LiveWS
  readonly ready: Promise<[undefined, void] | [Error, undefined]>
  constructor(public id: number) {
    super()
    this.ready = tryCatch(() => this.init(id))
  }

  async init(id: number) {
    const realRoomId = await getRoomid(id)
    const conf = await getConf(realRoomId)
    const address = `wss://${conf.host}:${conf.port}/sub`
    const uid = await API_bilibili.getSelfMid()
    const buvid = cookie.get('buvid3')

    console.log('realRoomId', realRoomId, conf)
    this.ws = new LiveWS(realRoomId, {
      protover: 3,
      address,
      key: conf.key,
      uid,
      buvid,
    })
    this.ws.on('open', () => console.log('弹幕ws连接成功'))
    this.ws.on('close', () => console.log('弹幕ws断开'))
    // Connection is established
    this.ws.on('live', () => {
      this.ws?.on('heartbeat', console.log)
      // 13928
    })

    this.ws.on('DANMU_MSG', (data) => {
      let info = data.info
      let color = '#' + info[0][3].toString(16),
        text = info[1]

      const extraRoot = info[0][15]
      const extraData =
        extraRoot && extraRoot.extra ? JSON.parse(extraRoot.extra) : ({} as any)
      const imageMap: Record<
        string,
        { url: string; width: number; height: number }
      > = {}
      if (extraData.emots) {
        const emots = extraData.emots
        for (const key in emots) {
          const emoticon = emots[key]
          imageMap[key] = {
            url: emoticon.url,
            width: emoticon.width,
            height: emoticon.height,
          }
        }
      }

      /** 
   * {
    "bulge_display": 1,
    "emoticon_unique": "upower_[2233娘_大笑]",
    "height": 20,
    "in_player_area": 1,
    "is_dynamic": 0,
    "url": "http://i0.hdslb.com/bfs/emote/16b8794be990cefa6caeba4d901b934a227ee3b8.png",
    "width": 20
}
   */
      const bigImageData = info[0][13]
      if (bigImageData) {
        if (
          bigImageData.emoticon_unique &&
          bigImageData.emoticon_unique === extraData.emoticon_unique &&
          extraData.content
        ) {
          imageMap[extraData.content] = {
            url: bigImageData.url,
            width: bigImageData.width,
            height: bigImageData.height,
          }
        }
      }

      console.log('danmu', text, info)
      this.emit('danmu', { color, text, imageMap })
    })
  }
  close(): void {
    this.ws?.ws.close()
  }
}
