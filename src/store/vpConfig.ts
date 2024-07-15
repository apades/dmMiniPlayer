import { makeAutoObservable, runInAction } from 'mobx'

class VpConfig {
  canShowDanmaku = false
  showDanmaku = true
  canSendDanmaku = false
  canShowSubtitle = false

  showSubtitle = false
  constructor() {
    makeAutoObservable(this)
  }
  reset() {
    runInAction(() => {
      this.canSendDanmaku = false
      this.canShowSubtitle = false
      this.canShowDanmaku = false
      this.showDanmaku = true
    })
  }
}
const vpConfig = new VpConfig()
window.vpConfig = vpConfig

export default vpConfig
