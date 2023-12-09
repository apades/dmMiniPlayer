import type { Barrage } from '@root/danmaku'
import { makeAutoObservable, runInAction } from 'mobx'

class VpConfig {
  canShowDanmakus = false
  showDanmakus = true
  canSendDanmaku = false
  canShowSubtitle = false

  inactiveDanmakusMap = new Map<string, Barrage>()
  activeDanmakusMap = new Map<string, Barrage>()
  get activeDanmakus() {
    return [...this.activeDanmakusMap.values()]
  }
  get inactiveDanmakus() {
    return [...this.inactiveDanmakusMap.values()]
  }
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
    })
  }
}
const vpConfig = new VpConfig()
window.vpConfig = vpConfig

export default vpConfig
