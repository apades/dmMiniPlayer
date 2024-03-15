import { config } from '@apad/setting-panel'
import { initSetting } from '@apad/setting-panel'
import { extStorage } from '@root/utils/storage'
import * as mobx from 'mobx'
import { docPIPConfig } from './docPIP'
import zh from '@apad/setting-panel/i18n/zh_cn.json'
import en from '@apad/setting-panel/i18n/en.json'
import config_danmaku from './danmaku'
import config_bilibili from './bilibili'
import config_subtitle from './subtitle'
import { isEn, t } from '@root/utils/i18n'
import { observer } from 'mobx-react'

export { DocPIPRenderType } from './docPIP'

export const baseConfigMap = {
  ...config_danmaku,
  ...config_bilibili,
  ...config_subtitle,
  // fps限制相关
  renderFPS: config({
    defaultValue: 60,
    label: t('settingPanel.renderFPS'),
    desc: t('settingPanel.renderFPSDesc'),
  }),
  FPS_limitOffsetAccurate: config({
    defaultValue: false,
    desc: t('settingPanel.FPS_limitOffsetAccurateDesc'),
    label: t('settingPanel.FPS_limitOffsetAccurate'),
    notRecommended: true,
  }),

  videoProgress_show: config({
    defaultValue: true,
    label: t('settingPanel.videoProgress_show'),
    desc: t('settingPanel.videoProgress_showDesc'),
  }),
  videoProgress_color: config({
    defaultValue: '#00AEEC',
    label: t('settingPanel.videoProgress_color'),
    relateBy: 'videoProgress_show',
    relateByValue: true,
  }),
  videoProgress_height: config({
    defaultValue: 2,
    label: t('settingPanel.videoProgress_height'),
    relateBy: 'videoProgress_show',
    relateByValue: true,
  }),

  sideWidth: config({
    defaultValue: 300,
    label: t('settingPanel.sideWidth'),
  }),
  // TODO canvas增加视频信息
  // showInfoInBackOrForward: config({
  //   defaultValue: true,
  //   desc: '直播下无效',
  //   label: '快进/后退时显示视频信息',
  //   deprecated: true,
  // }),
  playbackRate: config({
    defaultValue: 3,
    label: t('settingPanel.playbackRate'),
    desc: t('settingPanel.playbackRateDesc'),
  }),
  pauseInClose_video: config({
    defaultValue: true,
    label: t('settingPanel.pauseInClose_video'),
  }),
  pauseInClose_live: config({
    defaultValue: false,
    label: t('settingPanel.pauseInClose_live'),
    desc: t('settingPanel.pauseInClose_liveDesc'),
    relateBy: 'pauseInClose_video',
    relateByValue: true,
  }),
  // debug
  performanceInfo: config({
    defaultValue: process.env.PLASMO_PUBLIC_IS_DEV == 'true',
    label: t('settingPanel.performanceInfo'),
  }),
  performanceUpdateFrame: config({
    defaultValue: 30,
    label: t('settingPanel.performanceUpdateFrame'),
    desc: t('settingPanel.performanceUpdateFrameDesc'),
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
    label: t('settingPanel.saveHeightOnDocPIPCloseOffset'),
    desc: t('settingPanel.saveHeightOnDocPIPCloseOffsetDesc'),
    notRecommended: true,
  }),
  saveWidthOnDocPIPCloseOffset: config({
    defaultValue: 16,
    label: t('settingPanel.saveWidthOnDocPIPCloseOffset'),
    desc: t('settingPanel.saveWidthOnDocPIPCloseOffsetDesc'),
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
  i18n: isEn ? en : zh,
  mobxObserver: observer,
}

if (isPluginEnv) {
  Object.assign(settingProps, {
    onSave(newConfig: Partial<typeof configStore>) {
      if (newConfig.useDocPIP) {
        if (!window?.documentPictureInPicture) {
          delete newConfig.useDocPIP
          alert(t('settingPanel.unsupportDocPIPTips'))
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
