import AsyncLock from '@root/utils/AsyncLock'
import { extStorage } from '@root/utils/storage'
import { isNumber } from 'lodash-es'
import { makeAutoObservable, makeObservable, runInAction } from 'mobx'
import Browser from 'webextension-polyfill'
// import { getEnv } from '@apad/env-tools/lib/web'

export type ConfigField<T> = {
  defaultValue?: T
  desc?: string
  label?: string
  deprecated?: boolean
}

function config<T>(config: ConfigField<T>) {
  return config
}
export const baseConfigMap = {
  // 渲染画布设置
  renderWidth: config({
    defaultValue: 400,
    // deprecated: true,
    desc: '渲染的宽度，默认400，但默认有自动根据pip窗口调整，不用去管这个设置',
    label: 'canvas画布宽度',
  }),
  renderHeight: config<number>({
    // deprecated: true,
    defaultValue: (400 / 16) * 9,
    desc:
      '默认使用renderWidth 400，然后以视频实际比例计算出该height，但默认有自动根据pip窗口调整，不用去管这个设置',
    label: 'canvas画布高度',
  }),
  autoResizeInPIP: config({
    defaultValue: true,
    desc: '默认开启，可能有些电脑会有性能问题可以关闭',
    label: '画中画调整时自动调整画布大小',
  }),
  autoRatio: config({
    defaultValue: true,
    desc: '自动根据视频比例调整画布比例，默认开启',
    label: '根据视频比例自动调整画布比例',
  }),
  renderFPS: config({
    defaultValue: 60,
    desc: '限制渲染帧数，默认60，设置0就是无上限',
    label: 'canvas渲染的帧数',
  }),

  // 弹幕设置
  opacity: config({
    defaultValue: 1,
    desc: '默认1，范围0 ~ 1',
    label: '弹幕透明度',
  }),
  fontSize: config({
    defaultValue: 16,
    desc: '默认16',
    label: '弹幕字体大小',
  }),
  fontWeight: config({
    defaultValue: 600,
    desc: '默认600',
    label: '弹幕字体宽度',
  }),
  fontFamily: config({
    defaultValue: '"microsoft yahei", sans-serif',
    desc: '默认 "microsoft yahei", sans-serif',
    label: '弹幕字体',
  }),
  gap: config({
    defaultValue: 4,
    desc: '默认为4',
    label: '上下弹幕之间的间距',
  }),
  maxTunnel: config({
    defaultValue: '1/2' as number | '1/2' | '1/4' | 'full',
    desc: '默认1/2半屏',
    label: '弹幕最大渲染行数',
  }),

  // debug
  performanceInfo: config({
    defaultValue: process.env.PLASMO_PUBLIC_IS_DEV == 'true',
    label: '性能面版',
  }),
  performanceUpdateFrame: config({
    defaultValue: 30,
    desc: '性能面板每触发request多少次更新一次，默认30',
    label: '性能面版更新频率',
  }),
}

const LOCAL_CONFIG = 'LOCAL_CONFIG'

export type BaseConfig = {
  [k in keyof typeof baseConfigMap]: typeof baseConfigMap[k]['defaultValue']
}

class ConfigStore implements BaseConfig {
  renderWidth: BaseConfig['renderWidth']
  renderHeight: BaseConfig['renderHeight']
  autoResizeInPIP: BaseConfig['autoResizeInPIP']
  autoRatio: BaseConfig['autoRatio']
  renderFPS: BaseConfig['renderFPS']

  opacity: BaseConfig['opacity']
  fontSize: BaseConfig['fontSize']
  fontWeight: BaseConfig['fontWeight']
  fontFamily: BaseConfig['fontFamily']
  gap: BaseConfig['gap']
  maxTunnel: BaseConfig['maxTunnel']

  performanceInfo: BaseConfig['performanceInfo']
  performanceUpdateFrame: BaseConfig['performanceUpdateFrame']

  localConfig = {} as Partial<BaseConfig>
  lock = new AsyncLock()
  constructor() {
    Object.entries(baseConfigMap).forEach(([key, val]) => {
      ;(this as any)[key] = val.defaultValue
    })
    makeAutoObservable(this)

    extStorage.get<Partial<BaseConfig>>(LOCAL_CONFIG).then((data = {}) => {
      Object.assign(this, data)
      this.localConfig = data
      this.lock.ok()
    })
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

  setConfig(config: Partial<BaseConfig>) {
    return extStorage.set(LOCAL_CONFIG, config)
  }

  /**临时改变设置 */
  async setConfigTemp(config: Partial<BaseConfig>) {
    await this.lock.waiting()
    Object.assign(this, config, this.localConfig)
  }
}

const configStore = new ConfigStore()
window.configStore = configStore
export default configStore
