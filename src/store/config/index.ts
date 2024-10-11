import { config } from '@apad/setting-panel'
import { initSetting } from '@apad/setting-panel'
import {
  getBrowserSyncStorage,
  setBrowserSyncStorage,
} from '@root/utils/storage'
import * as mobx from 'mobx'
import { docPIPConfig } from './docPIP'
import zh from '@apad/setting-panel/i18n/zh_cn.json'
import en from '@apad/setting-panel/i18n/en.json'
import config_danmaku from './danmaku'
import config_bilibili from './bilibili'
import config_subtitle from './subtitle'
import { isEn, t } from '@root/utils/i18n'
import { DM_MINI_PLAYER_CONFIG } from '@root/shared/storeKey'
import isPluginEnv from '@root/shared/isPluginEnv'

export { DocPIPRenderType } from './docPIP'

export enum videoBorderType {
  default = 'default',
  width = 'width',
  height = 'height',
}

export const baseConfigMap = {
  ...config_danmaku,
  ...config_bilibili,
  ...config_subtitle,
  FPS_limitOffsetAccurate: config({
    defaultValue: false,
    desc: t('settingPanel.FPS_limitOffsetAccurateDesc'),
    label: t('settingPanel.FPS_limitOffsetAccurate'),
    notRecommended: true,
  }),

  videoNoJudgeDurInLive: config({
    desc: t('settingPanel.videoNoJudgeDurationInLiveDesc'),
    defaultValue: false,
    notRecommended: true,
  }),
  videoSharpening: config({
    defaultValue: false,
    label: t('settingPanel.videoSharpening'),
    desc: t('settingPanel.videoSharpeningDesc'),
  }),
  videoNoBorder: config<videoBorderType>({
    type: 'group',
    label: t('settingPanel.videoNoBorder'),
    desc: t('settingPanel.videoNoBorderDesc'),
    defaultValue: videoBorderType.default,
    group: [
      {
        label: t('settingPanel.videoNoBorder_default'),
        value: videoBorderType.default,
      },
      {
        label: t('settingPanel.videoNoBorder_width'),
        value: videoBorderType.width,
      },
      {
        label: t('settingPanel.videoNoBorder_height'),
        value: videoBorderType.height,
      },
    ],
  }),
  videoProgress_show: config({
    defaultValue: true,
    label: t('settingPanel.videoProgress_show'),
    desc: t('settingPanel.videoProgress_showDesc'),
  }),
  videoProgress_color: config({
    defaultValue: '#0669ff',
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
  useIframeToDetectIsLiveOnYoutube: config({
    defaultValue: true,
    label: 'useIframeDetectionOnYT',
    desc: 'use chat iframe to decect isLive on Youtube, else use HTML element',
    notRecommended: true,
  }),
  performanceInfo: config({
    defaultValue: false,
    label: t('settingPanel.performanceInfo'),
    notRecommended: true,
  }),
  performanceUpdateFrame: config({
    defaultValue: 30,
    label: t('settingPanel.performanceUpdateFrame'),
    desc: t('settingPanel.performanceUpdateFrameDesc'),
    relateBy: 'performanceInfo',
    relateByValue: true,
    notRecommended: true,
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
    defaultValue: 0,
    label: t('settingPanel.saveHeightOnDocPIPCloseOffset'),
    desc: t('settingPanel.saveHeightOnDocPIPCloseOffsetDesc'),
    notRecommended: true,
  }),
  saveWidthOnDocPIPCloseOffset: config({
    defaultValue: 0,
    label: t('settingPanel.saveWidthOnDocPIPCloseOffset'),
    desc: t('settingPanel.saveWidthOnDocPIPCloseOffsetDesc'),
    notRecommended: true,
  }),
  ...docPIPConfig,
}

export const { configStore, openSettingPanel, closeSettingPanel, observe } =
  initSetting({
    settings: baseConfigMap,
    saveInLocal: !isPluginEnv,
    mobx,
    i18n: isEn ? en : zh,
    onSave(newConfig) {
      if (!isPluginEnv) return
      if (newConfig.useDocPIP) {
        if (!window?.documentPictureInPicture) {
          delete (newConfig as any).useDocPIP
          alert(t('settingPanel.unsupportDocPIPTips'))
        }
      }
      setBrowserSyncStorage(DM_MINI_PLAYER_CONFIG, newConfig)
    },
    async onInitLoadConfig(config) {
      if (!isPluginEnv) return config
      // 这里去掉as any会触发ts的循环type错误
      const savedConfig = (await getBrowserSyncStorage(
        DM_MINI_PLAYER_CONFIG
      )) as any

      return { ...config, ...(savedConfig ?? {}) }
    },
    useShadowDom: true,
  })

// 同步多个tab的config
if (isPluginEnv) {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return

    const config = await getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG)
    if (config && window.__spSetSavedConfig) {
      window.__spSetSavedConfig(config)
    }
  })
}

window.configStore = configStore
window.openSettingPanel = openSettingPanel
export default configStore
