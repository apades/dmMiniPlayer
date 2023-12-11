import type { Barrage } from '@root/danmaku'
import { makeAutoObservable, runInAction } from 'mobx'

class VpConfig {
  canShowDanmakus = false
  showDanmakus = true
  canSendDanmaku = false
  canShowSubtitle = false

  // inactiveDanmakusMap = new Map<string, Barrage>()
  danmakuLength = 0
  // TODO 视频的情况卡顿很严重，一直js重复执行不是个事
  activeDanmakusMap = new Map<string, Barrage>()
  get activeDanmakus() {
    return [...this.activeDanmakusMap.values()]
  }
  // get inactiveDanmakus() {
  //   return [...this.inactiveDanmakusMap.values()]
  // }
  pushActiveDanmaku(danmaku: Barrage) {
    runInAction(() => {
      this.activeDanmakusMap.set(danmaku.id, danmaku)
    })
  }
  removeActiveDanmaku(id: string) {
    runInAction(() => {
      this.activeDanmakusMap.delete(id)
    })
  }

  constructor() {
    makeAutoObservable(this)
  }
  reset() {
    runInAction(() => {
      this.canSendDanmaku = false
      this.canShowSubtitle = false
      this.canShowDanmakus = false
      this.showDanmakus = true
      this.danmakuLength = 0
    })
  }
}
const vpConfig = new VpConfig()
window.vpConfig = vpConfig

export default vpConfig
