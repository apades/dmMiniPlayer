import { LiveWS, LiveTCP, KeepLiveWS, KeepLiveTCP } from 'bilibili-live-ws'
import { EventEmitter } from 'events'

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

type LiveEvent = {
  danmu: { color: string; text: string }
}
export default class BilibiliLiveBarrageClient extends EventEmitter {
  ws: LiveWS
  constructor(public id: number) {
    super()
    this.init(id)
  }

  async init(id: number) {
    const realRoomId = await getRoomid(id)
    console.log('realRoomId', realRoomId)
    this.ws = new LiveWS(realRoomId)
    this.ws.on('open', () => console.log('Connection is established'))
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
      // console.log(`${color} ${text}`, data)
    })
  }

  addEventListener<TType extends keyof LiveEvent>(
    e: TType,
    cb: (data: LiveEvent[TType]) => void
  ) {
    return super.addListener(e as string, cb)
  }
  emit<TType extends keyof LiveEvent>(
    eventName: TType,
    args: LiveEvent[TType]
  ): boolean {
    return super.emit(eventName, args)
  }
}
