import { config, initSetting } from '@apad/setting-panel'
import { extStorage } from '@root/utils/storage'
import * as mobx from 'mobx'
import { runInAction } from 'mobx'
import { docPIPConfig } from './docPIP'

export { DocPIPRenderType } from './docPIP'

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}
export const baseConfigMap = {
  renderFPS: config({
    defaultValue: 60,
    desc: '限制渲染帧数，默认60，设置0就是无上限',
    label: 'canvas渲染的帧数',
  }),
  videoProgress_show: config({
    defaultValue: true,
    desc: '非直播视频底下增加进度条显示',
    label: '显示进度条',
  }),
  videoProgress_color: config({
    defaultValue: '#00AEEC',
    label: '进度条颜色',
    category: '视频进度条',
  }),
  videoProgress_height: config({
    defaultValue: 2,
    label: '进度条高度',
    category: '视频进度条',
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
    notRecommended: true,
    defaultValue: '"microsoft yahei", sans-serif',
    desc: '原本默认 "microsoft yahei", sans-serif，但现在都用了网站的默认字体，后续再开放修改',
    label: '弹幕字体',
  }),
  gap: config({
    defaultValue: 4,
    desc: '默认为4',
    label: '上下弹幕之间的间距',
  }),
  maxTunnel: config<MaxTunnelType>({
    defaultValue: MaxTunnelType['1/2'],
    desc: '默认1/2半屏，还支持 1/2 | 1/4 | full，剩下的只能填数字',
    label: '弹幕最大渲染行数',
    type: 'group',
    group: [MaxTunnelType['1/2'], MaxTunnelType['1/4'], MaxTunnelType.full],
  }),

  // TODO
  // showInfoInBackOrForward: config({
  //   defaultValue: true,
  //   desc: '直播下无效',
  //   label: '快进/后退时显示视频信息',
  //   deprecated: true,
  // }),
  playbackRate: config({
    defaultValue: 3,
    desc: '直播下无效',
    label: '快捷键的倍速播放速率',
  }),

  biliVideoPakkuFilter: config({
    defaultValue: true,
    label: 'b站视频弹幕使用pakku.js过滤',
    desc: '只有bilibili-evaolved模式开了才能用。目前只有过滤+减少弹幕，原始json文件一屏弹幕量会非常多，没有特殊功能',
  }),
  biliVideoDansFromBiliEvaolved: config({
    defaultValue: false,
    label: '使用bilibili-evaolved获取b站视频弹幕',
    desc: '该模式有问题没法下载完全的弹幕',
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
  vpActionAreaLock: false,
  vpBufferTest: false,
  ...docPIPConfig,
}

const LOCAL_CONFIG = 'LOCAL_CONFIG'

window.extStorage = extStorage

const isPluginEnv = !!chrome?.storage
const settingProps = {
  settings: baseConfigMap,
  saveInLocal: !isPluginEnv,
  mobx,
}

if (isPluginEnv) {
  Object.assign(settingProps, {
    onSave(newConfig: Partial<typeof configStore>) {
      if (newConfig.useDocPIP) {
        if (!window?.documentPictureInPicture) {
          delete newConfig.useDocPIP
          alert(
            '你的浏览器不支持新的画中画功能，请替换chrome/edge浏览器且版本在116及以上\n或者在浏览器中chrome://flags/#document-picture-in-picture-api查看该功能是否存在并设置为Enabled，然后重启浏览器'
          )
        }
      }
      return extStorage.set(LOCAL_CONFIG, newConfig)
    },
    async onInitLoadConfig(config: any) {
      const savedConfig =
        ((await extStorage.get<Record<any, any>>(
          LOCAL_CONFIG
        )) as typeof config) || {}

      return { ...config, ...savedConfig }
    },
    useShadowDom: true,
  })
}

export const { configStore, openSettingPanel, closeSettingPanel, observe } =
  initSetting({ ...settingProps })

window.configStore = configStore
window.openSettingPanel = openSettingPanel
export default configStore
