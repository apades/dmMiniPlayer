import { config, initSetting } from '@apad/setting-panel'
import { extStorage } from '@root/utils/storage'
import * as mobx from 'mobx'
import { runInAction } from 'mobx'
import { docPIPConfig } from './docPIP'
import zh from '@apad/setting-panel/i18n/zh_cn.json'

export { DocPIPRenderType } from './docPIP'

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}

const DANMAKU = '弹幕'
export const baseConfigMap = {
  renderFPS: config({
    defaultValue: 60,
    desc: '限制渲染帧数，默认60，设置0就是无上限',
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

  // 弹幕设置
  danSpeed: config({
    defaultValue: 20,
    label: '弹幕速度',
    desc: '受 canvas渲染的帧数 影响，每次x+=val/10',
    category: DANMAKU,
  }),
  danVerticalSafeTime: config({
    defaultValue: 5,
    label: '垂直弹幕停留时间',
    category: DANMAKU,
  }),
  opacity: config({
    defaultValue: 1,
    desc: '默认1，范围0 ~ 1',
    label: '弹幕透明度',
    category: DANMAKU,
  }),
  fontSize: config({
    defaultValue: 16,
    desc: '默认16',
    label: '弹幕字体大小',
    category: DANMAKU,
  }),
  fontWeight: config({
    defaultValue: 600,
    desc: '默认600',
    label: '弹幕字体宽度',
    category: DANMAKU,
  }),
  fontFamily: config({
    defaultValue: 'Segoe UI Emoji, SimHei, "microsoft yahei", sans-serif',
    label: '弹幕字体',
  }),
  fontShadow: config({
    defaultValue: true,
    label: '弹幕阴影加深',
    desc: '额外渲染了一次字体，可能会加大性能消耗',
    category: DANMAKU,
  }),
  gap: config({
    defaultValue: 4,
    desc: '默认为4',
    label: '上下弹幕之间的间距',
    category: DANMAKU,
  }),
  maxTunnel: config<MaxTunnelType>({
    defaultValue: MaxTunnelType['1/2'],
    desc: '默认1/2半屏，还支持 1/2 | 1/4 | full，剩下的只能填数字',
    label: '弹幕最大渲染行数',
    type: 'group',
    group: [MaxTunnelType['1/2'], MaxTunnelType['1/4'], MaxTunnelType.full],
    category: DANMAKU,
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

  biliVideoDansFromBiliEvaolved: config({
    defaultValue: false,
    label: '使用bilibili-evaolved获取b站视频弹幕',
    desc: '该模式有问题没法下载完全的弹幕',
  }),
  biliVideoPakkuFilter: config({
    defaultValue: true,
    label: 'b站视频弹幕使用pakku.js过滤',
    desc: '只有bilibili-evaolved模式开了才能用。目前只有过滤+减少弹幕，原始json文件一屏弹幕量会非常多，没有特殊功能',
    relateBy: 'biliVideoDansFromBiliEvaolved',
    relateByValue: true,
  }),

  biliLiveSide: config({
    defaultValue: false,
    label: 'b站直播侧边栏',
    desc: '实验性功能，同时需要切换reactVP_canvasCs模式',
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
