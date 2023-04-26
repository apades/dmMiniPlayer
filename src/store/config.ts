import AsyncLock from '@root/utils/AsyncLock'
import { isNumber } from 'lodash-es'
import { makeAutoObservable, runInAction } from 'mobx'
import Browser from 'webextension-polyfill'
// import { getEnv } from '@apad/env-tools/lib/web'

const LOCAL_CONFIG = 'LOCAL_CONFIG'
type ConfigProps = {
  /**默认400 */
  renderWidth: number
  /**默认使用renderWidth 400，然后以视频实际比例计算出该height */
  renderHeight: number
  /**弹幕透明度，默认1 */
  opacity: number
  /**弹幕字体大小，默认16 */
  fontSize: number
  /**字体宽度，默认600 */
  fontWeight: number
  /**字体，默认 "microsoft yahei", sans-serif */
  fontFamily: string

  /**自动比例，默认开启 */
  autoRatio: boolean
  /**画中画大小调整也让渲染的画布自动调整大小，默认开启，可能有些电脑会有性能问题可以关闭 */
  autoResizeInPIP: boolean

  /**
   * 默认auto自动检测视频帧数
   *
   * TODO
   */
  videoRenderFPS: number | string
  /**
   * 默认auto，requestAnimationFrame一触发也跟着触发
   *
   * TODO
   */
  danmuRenderFPS: number | string

  /**上下弹幕之间的间距，默认为4 */
  gap: number

  /**性能面板 */
  performanceInfo: boolean
  /**性能面板每触发request多少次更新一次，默认100 */
  performanceUpdateFrame: number

  /**最大渲染行数，默认无限 */
  maxTunnel: number | '1/2' | '1/4' | 'full'

  fontFileList: { src: string }[]
}

class ConfigStore implements ConfigProps {
  renderWidth = 500
  renderHeight: number = (400 / 16) * 9
  opacity = 1

  fontSize = 16
  fontFamily = '"microsoft yahei", sans-serif'
  fontWeight = 600

  autoRatio = true
  autoResizeInPIP = true

  videoRenderFPS = 1000 / 60
  danmuRenderFPS = 1000 / 60

  gap = 4

  performanceInfo = process.env.PLASMO_PUBLIC_IS_DEV == 'true'
  performanceUpdateFrame = 30
  maxTunnel = '1/2' as ConfigProps['maxTunnel']
  fontFileList = [] as ConfigProps['fontFileList']

  localConfig = {} as ConfigProps
  lock = new AsyncLock()
  constructor() {
    // Browser.storage.local.get(LOCAL_CONFIG).then((data = {}) => {
    //   Object.assign(this, data)
    //   this.localConfig = data as ConfigProps
    //   this.lock.ok()
    // })

    makeAutoObservable(this)
  }

  setRatioWidth(
    videoEl: HTMLVideoElement,
    option: { renderHeight: number }
  ): void
  setRatioWidth(
    videoEl: HTMLVideoElement,
    option: { renderWidth: number }
  ): void
  setRatioWidth(
    videoEl: HTMLVideoElement,
    option: { renderHeight: number; renderWidth: number }
  ) {
    runInAction(() => {
      if (option.renderHeight && option.renderWidth) {
        this.renderHeight = option.renderHeight
        this.renderWidth = option.renderWidth
        return
      }

      if (option.renderWidth) {
        if (this.autoRatio)
          this.renderHeight =
            (option.renderWidth / videoEl.videoWidth) * videoEl.videoHeight

        this.renderWidth = option.renderWidth
      }
      if (option.renderHeight) {
        if (this.autoRatio)
          this.renderWidth =
            (option.renderHeight / videoEl.videoHeight) * videoEl.videoWidth

        this.renderHeight = option.renderHeight
      }
    })
  }

  setConfig(config: Partial<ConfigProps>) {
    return Browser.storage.local.set({ [LOCAL_CONFIG]: config })
  }

  /**临时改变设置 */
  async setConfigTemp(config: Partial<ConfigProps>) {
    await this.lock.waiting()
    Object.assign(this, config, this.localConfig)
  }
}

const configStore = new ConfigStore()
window.configStore = configStore
export default configStore
