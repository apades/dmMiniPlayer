import { makeAutoObservable, runInAction } from 'mobx'

class VpConfig {
  canShowBarrage = false
  showBarrage = true
  canSendBarrage = false
  canShowSubtitle = false

  showSubtitle = false
  constructor() {
    makeAutoObservable(this)
  }
  reset() {
    runInAction(() => {
      this.canSendBarrage = false
      this.canShowSubtitle = false
      this.canShowBarrage = false
      this.showBarrage = true
    })
  }
}
const vpConfig = new VpConfig()
window.vpConfig = vpConfig

export default vpConfig
