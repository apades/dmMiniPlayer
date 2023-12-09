import BarrageClient, {
  LiveBarrageClient,
} from '@root/core/danmaku/BarrageClient'
import type { OrPromise } from '@root/utils/typeUtils'
import { LiveWS } from 'bilibili-live-ws'

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

export default class BilibiliLiveBarrageClient extends LiveBarrageClient {
  ws: LiveWS
  async onInit() {
    const realRoomId = await getRoomid(+this.getId())
    console.log('realRoomId', realRoomId)
    this.ws = new LiveWS(realRoomId)
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
    this.ws.ws.close()
    this.ws = null
  }
}
