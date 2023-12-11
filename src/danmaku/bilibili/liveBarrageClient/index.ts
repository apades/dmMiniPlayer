import BarrageClient, {
  LiveBarrageClient,
} from '@root/core/danmaku/BarrageClient'
import type { OrPromise } from '@root/utils/typeUtils'
import { KeepLiveWS as LiveWS } from 'bilibili-live-ws'
import cookie from 'js-cookie'

export const proto = {
  nested: {
    DMLiveReply: {},
  },
}

const getRealRoomid = async (short: number) => {
  const {
    data: { room_id },
  } = await fetch(
    `https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=${short}`
  ).then((w) => w.json())
  return room_id
}

const getWsTokenAndHost = async (roomid: number) => {
  const data = await fetch(
    `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomid}&type=0`,
    {
      credentials: 'include',
    }
  ).then((r) => r.json())

  if (data.code !== 0) {
    console.error(data)
    throw new Error('bili live接口返回错误，具体返回看console')
  }
  return { token: data.data.token, host: data.data.host_list[0].host }
}

export default class BilibiliLiveBarrageClient extends LiveBarrageClient {
  ws: LiveWS
  async onInit() {
    const realRoomId = await getRealRoomid(+this.getId())
    console.log('realRoomId', realRoomId)
    const { token, host } = await getWsTokenAndHost(realRoomId)
    const buvid = cookie.get('buvid3'),
      uid = cookie.get('DedeUserID')

    this.ws = new LiveWS(realRoomId, {
      address: `wss://${host}/sub`,
      authBody: {
        uid: +uid,
        roomid: realRoomId,
        protover: 3,
        buvid,
        platform: 'web',
        type: 2,
        key: token,
      },
    })
    this.ws.on('open', () => console.log('Connection is established'))
    // Connection is established
    this.ws.on('live', () => {
      this.ws.on('heartbeat', console.log)
      // 13928
    })

    this.ws.on('DANMU_MSG', (data) => {
      let info = data.info,
        userInfo = info[2]
      let color = '#' + info[0][3].toString(16),
        text = info[1]

      this.emit('danmu', {
        color,
        text,
        type: 'right',
        uid: userInfo[0] + '',
        uname: userInfo[1] + '',
      })
    })
  }
  protected getId(): OrPromise<string> {
    return location.pathname.split('/').pop()
  }
  onClose(): void {
    this.ws.close()
    this.ws = null
  }
}
