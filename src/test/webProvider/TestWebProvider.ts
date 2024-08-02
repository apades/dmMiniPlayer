import { WebProvider } from '@root/core/WebProvider'
import { dans } from '../data/dans'

export default class TestWebProvider extends WebProvider {
  onInit(): void {}
  onPlayerInitd(): void {
    this.danmakuEngine?.setDanmakus(dans)
  }
}
