import CCWs from './websocket'
import BarrageClient from '@root/core/danmaku/BarrageClient'

export default class CCLiveBarrageClient extends BarrageClient {
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
  close(): void {
    this.ws.ws.close()
  }
}
