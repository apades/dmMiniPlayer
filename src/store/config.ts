import { makeAutoObservable } from 'mobx'

type ConfigProps = {
  /**默认400 */
  renderWidth: number
  /**默认使用renderWidth 400，然后以视频实际比例计算出该height */
  renderHeight: number
  /**弹幕透明度，默认1 */
  opacity: number
  /**弹幕字体大小，默认16 */
  fontSize: number
  /**
   * 默认能加载多大就多大
   *
   * TODO
   */
  frames: string | number
}

class ConfigStore implements ConfigProps {
  renderWidth = 400
  renderHeight: number = (400 / 16) * 9
  opacity = 1
  fontSize = 16
  frames = 'auto'

  constructor() {
    makeAutoObservable(this)
  }
}

const configStore = new ConfigStore()
export default configStore
