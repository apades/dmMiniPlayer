import { LiveBarrageClient } from '@root/core/danmaku/BarrageClient'
import CCWs from './websocket'

export default class CCLiveBarrageClient extends LiveBarrageClient {
  ws: CCWs
  getId() {
    return location.pathname.split('/').pop()
  }
  protected onInit(): void {
    this.ws = new CCWs(this.getId())

    this.ws.getWs().then((ws) => {
      console.log('getWs', ws)
      ws.addEventListener('message', (e) => {
        const list = this.ws.decode_msg(e.data)

        if (!list) return
        list.forEach((content) => {
          this.emit('danmu', content)
        })
      })
    })
  }
  onClose(): void {
    this.ws.ws.close()
  }
}
