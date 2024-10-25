import cookie from '@pkgs/js-cookie'
import { DanmakuGetter } from '../..'
import { LiveWS } from 'bilibili-live-ws'

async function getSelfMid() {
  try {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
      credentials: 'include',
    }).then((res) => res.json())

    return res.data.mid as number
  } catch (error) {
    console.error(error)
    return undefined
  }
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
    `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomid}&type=0`,
    {
      credentials: 'include',
    }
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

export default class BilibiliLive extends DanmakuGetter {
  ws?: LiveWS
  onInit = async () => {
    const id = +this.url.pathname.split('/').pop()!

    const realRoomId = await getRoomid(id)
    const conf = await getConf(realRoomId)
    const address = `wss://${conf.host}:${conf.port}/sub`
    const uid = await getSelfMid()
    const buvid = cookie(this.cookie).get('buvid3')

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
      this.emit('addDanmakus', [{ color, text, type: 'right' }])
    })
  }
  onUnload = () => {
    if (!this.ws) return
    this.ws?.ws.close()
  }
}
