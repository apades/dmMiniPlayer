import CCWs from './websocket'
import { DanmakuLiveEventEmitter } from '../struct'

export default class CCLiveBarrageClient extends DanmakuLiveEventEmitter {
  ws: CCWs
  constructor(public id: number) {
    super()
    this.ws = new CCWs(this.id)

    this.ws.getWs().then((ws) => {
      console.log('getWs', ws)
      ws.addEventListener('message', (e) => {
        const list = this.ws.decode_msg(e.data as ArrayBuffer)

        if (!list) return
        list.forEach(({ color, content }) => {
          this.emit('danmu', { color, text: content })
        })
      })
    })
  }
}
