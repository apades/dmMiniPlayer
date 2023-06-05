import { EventEmitter } from 'events'
import CCWs from './websocket'

type LiveEvent = {
  danmu: { color: string; text: string }
}
export default class CCLiveBarrageClient extends EventEmitter {
  ws: CCWs
  constructor(public id: number) {
    super()
    this.ws = new CCWs(this.id)

    this.ws.getWs().then((ws) => {
      console.log('getWs', ws)
      ws.addEventListener('message', (e) => {
        const list = this.ws.decode_msg(e.data)

        if (!list) return
        list.forEach(({ color, content }) => {
          this.emit('danmu', { color, text: content })
        })
      })
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
