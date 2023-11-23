import { config, initSetting } from '@apad/setting-panel'
import { extStorage } from '@root/utils/storage'
import * as mobx from 'mobx'
import { runInAction } from 'mobx'
import { docPIPConfig } from './docPIP'
import zh from '@apad/setting-panel/i18n/zh_cn.json'
import config_danmaku from './danmaku'
import config_bilibili from './bilibili'

export { DocPIPRenderType } from './docPIP'

export const baseConfigMap = {
  ...config_danmaku,
  ...config_bilibili,

  // fps限制相关
  renderFPS: config({
    defaultValue: 60,
    desc: '限制弹幕渲染帧数，设置0就是无上限。如果是旧版画中画或[双视频模式]模式，视频会受此影响',
    label: 'canvas渲染的帧数',
  }),
  FPS_limitOffsetAccurate: config({
    defaultValue: false,
    label: 'FPS限制算法使用精准now时间',
    desc: '默认记录的上一次更新时间是now - (offset % renderFPS)',
    notRecommended: true,
  }),

  videoProgress_show: config({
    defaultValue: true,
    desc: '非直播视频底下增加进度条显示',
    label: '显示进度条',
  }),
  videoProgress_color: config({
    defaultValue: '#00AEEC',
    label: '进度条颜色',
    relateBy: 'videoProgress_show',
    relateByValue: true,
  }),
  videoProgress_height: config({
    defaultValue: 2,
    label: '进度条高度',
    relateBy: 'videoProgress_show',
    relateByValue: true,
  }),

  sideWidth: config({
    defaultValue: 300,
    label: '侧边栏宽度',
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
    label: '快捷键/长按右键的倍速播放速率',
  }),
  pauseInClose_video: config({
    defaultValue: true,
    label: '关闭视频时暂停',
  }),
  pauseInClose_live: config({
    defaultValue: false,
    label: '关闭直播也暂停',
    desc: '并不是很推荐',
    relateBy: 'pauseInClose_video',
    relateByValue: true,
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
    relateBy: 'performanceInfo',
    relateByValue: true,
  }),
  vpActionAreaLock: config({
    notRecommended: true,
    defaultValue: false,
  }),
  vpBufferTest: config({
    notRecommended: true,
    defaultValue: false,
  }),
  saveHeightOnDocPIPCloseOffset: config({
    defaultValue: 8,
    label: '关闭docPIP时保存高度偏移',
    desc: 'chrome上很奇怪的用指定height打开docPIP会少8px，如果还偏移了可以调整',
    notRecommended: true,
  }),
  saveWidthOnDocPIPCloseOffset: config({
    defaultValue: 16,
    label: '关闭docPIP时保存宽度偏移',
    desc: '和 高度偏移一样',
    notRecommended: true,
  }),
  ...docPIPConfig,
}

const LOCAL_CONFIG = 'LOCAL_CONFIG'

window.extStorage = extStorage

const isPluginEnv = !!chrome?.storage
const settingProps = {
  settings: baseConfigMap,
  saveInLocal: !isPluginEnv,
  mobx,
  i18n: zh,
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

export const {
  configStore,
  openSettingPanel,
  closeSettingPanel,
  observe,
  temporarySetConfigStore,
} = initSetting({ ...settingProps })

window.configStore = configStore
window.openSettingPanel = openSettingPanel
export default configStore
