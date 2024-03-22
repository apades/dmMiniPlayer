import BarrageClient from '@root/core/danmaku/BarrageClient'
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
    `https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=${short}`
  ).then((w) => w.json())
  return room_id
}

export const getConf = async (roomid: number) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const raw = await fetch(
    `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomid}`
  ).then((w) => w.json())
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
  ws: LiveWS
  constructor(public id: number) {
    super()
    this.init(id)
  }

  async init(id: number) {
    const realRoomId = await getRoomid(id)
    const conf = await getConf(realRoomId)
    const address = `wss://${conf.host}:${conf.port}/sub`

    console.log('realRoomId', realRoomId, conf)
    this.ws = new LiveWS(realRoomId, {
      protover: 3,
      address,
      key: conf.key,
    })
    this.ws.on('open', () => console.log('弹幕ws连接成功'))
    this.ws.on('close', () => console.log('弹幕ws断开'))
    // Connection is established
    this.ws.on('live', () => {
      this.ws.on('heartbeat', console.log)
      // 13928
    })

    this.ws.on('DANMU_MSG', (data) => {
      let info = data.info
      let color = '#' + info[0][3].toString(16),
        text = info[1]

      this.emit('danmu', { color, text })
    })
  }
  close(): void {
    this.ws.ws.close()
  }
}
