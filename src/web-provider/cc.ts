import { WebProvider } from '@root/core/WebProvider'
import CCLiveBarrageClient from '@root/danmaku/cc/liveBarrageClient'

export default class CCLiveProvider extends WebProvider {
  onInit(): void {}

  danmakuWs?: CCLiveBarrageClient
  connectDanmakuWs() {
    const pathArr = location.pathname.split('/')
    pathArr.pop()

    this.danmakuWs = new CCLiveBarrageClient(+(pathArr.pop() ?? ''))
    this.addOnUnloadFn(
      this.danmakuWs.on2('danmu', (danmaku) => {
        // console.log('danmu', danmaku)
        this.danmakuEngine?.addDanmakus([
          {
            ...danmaku,
            type: 'right',
          },
        ])
      }),
    )
  }

  onUnload(): void {
    this.danmakuWs?.close()
  }
}
