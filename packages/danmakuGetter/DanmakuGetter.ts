import type { DanmakuInitData } from '@root/core/danmaku/DanmakuManager/types'
import { PlayerComponent } from '@root/core/types'
import Events2 from '@root/utils/Events2'

type DanmakuEvents = {
  addDanmakus: DanmakuInitData[]
  init: void
  unload: void
}

export type Props = {
  /**视频地址 */
  url: string
  /**视频地址对应的cookie */
  cookie?: string
}

export default abstract class DanmakuGetter
  extends Events2<DanmakuEvents>
  implements PlayerComponent
{
  url: URL
  cookie = ''
  constructor(props: Props) {
    super()
    this.cookie = props.cookie ?? ''
    this.url = new URL(props.url)
  }
  abstract onInit: (...args: any[]) => any
  abstract onUnload: (...args: any[]) => any
  init() {
    this.onInit()
    this.emit('init')
  }
  unload() {
    this.onUnload()
    this.emit('unload')
  }
}
