import type { Barrage } from '@root/danmaku'
import { makeAutoObservable, runInAction } from 'mobx'

class VpConfig {
  canShowDanmakus = false
  showDanmakus = true
  canSendDanmaku = false
  canShowSubtitle = false


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
