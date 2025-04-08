import cookie from '@pkgs/js-cookie'
import API_bilibili from '@root/api/bilibili'
import BarrageClient from '@root/core/danmaku/BarrageClient'
import { tryCatch } from '@root/utils'
import { t } from '@root/utils/i18n'
import { LiveWS, LiveTCP, KeepLiveWS, KeepLiveTCP } from 'bilibili-live-ws'
import toast from 'react-hot-toast'

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
  const raw = await fetch(
    `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomid}&type=0`,
    {
      credentials: 'include',
    },
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
  ws?: LiveWS
  constructor(public id: number) {
    super()
    tryCatch(() => this.init(id)).then(([err]) => {
      if (err) toast.error(t('error.danmakuLoad'))
    })
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

      // console.log('danmu', text, info)
      this.emit('danmu', { color, text })
    })
  }
  close(): void {
    this.ws?.ws.close()
  }
}
