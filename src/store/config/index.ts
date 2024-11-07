import { config } from '@apad/setting-panel'
import { initSetting } from '@apad/setting-panel'
import {
  getBrowserSyncStorage,
  setBrowserLocalStorage,
  setBrowserSyncStorage,
  useBrowserSyncStorage,
} from '@root/utils/storage'
import * as mobx from 'mobx'
import { docPIPConfig, DocPIPRenderType } from './docPIP'
import zh from '@apad/setting-panel/i18n/zh_cn.json'
import en from '@apad/setting-panel/i18n/en.json'
import config_danmaku from './danmaku'
import config_bilibili from './bilibili'
import config_subtitle from './subtitle'
import {
  getIsZh,
  Language,
  LanguageNativeNames,
  getNowLang,
  t,
} from '@root/utils/i18n'
import {
  DM_MINI_PLAYER_CONFIG,
  FLOAT_BTN_HIDDEN,
  LOCALE,
} from '@root/shared/storeKey'
import isPluginEnv from '@root/shared/isPluginEnv'
import config_floatButton from './floatButton'
import { isUndefined } from 'lodash-es'
import { sendMessage as sendMessageInCs } from 'webext-bridge/content-script'
import { sendMessage as sendMessageInBg } from 'webext-bridge/background'
import isBG from '@root/shared/isBG'
import WebextEvent from '@root/shared/webextEvent'

export { DocPIPRenderType } from './docPIP'

export enum videoBorderType {
  default = 'default',
  width = 'width',
  height = 'height',
}

export const baseConfigMap = {
  ...config_floatButton,
  ...config_danmaku,
  ...config_bilibili,
  ...config_subtitle,
  language: config<Language>({
    label: 'Language',
    desc: 'Will reload page when language has changed',
    defaultValue: getNowLang(),
    type: 'group',
    group: Object.values(Language).map((v) => ({
      label: LanguageNativeNames[v],
      value: v,
    })),
  }),
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
    defaultValue: false,
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
  dragArea_show: config({ defaultValue: false, notRecommended: true }),
  /**
   * 在4个角范围内，保存位置是绝对值
   *
   * 如果不在4个角范围内，保存的位置会是相对值。例如在top区，top为绝对值，left为以中线为准，计算出绝对值
   *  */
  dragArea_cornerPercentW: config({ defaultValue: 30, notRecommended: true }),
  dragArea_cornerPercentH: config({ defaultValue: 30, notRecommended: true }),
  ...docPIPConfig,
}

export const { configStore, openSettingPanel, closeSettingPanel, observe } =
  initSetting({
    settings: baseConfigMap,
    saveInLocal: !isPluginEnv,
    mobx,
    i18n: getIsZh() ? zh : en,
    async onSave(newConfig) {
      if (newConfig.language) {
        await setBrowserLocalStorage(LOCALE, newConfig.language)
        location.reload()
        delete (newConfig as any).language
      }

      if (!isPluginEnv) return

      // 判断是否需要请求tabCapture权限
      // if (
      //   newConfig.notSameOriginIframeCaptureModePriority ===
      //     DocPIPRenderType.capture_tabCapture ||
      //   newConfig.docPIP_renderType === DocPIPRenderType.capture_tabCapture
      // ) {
      //   let sendFn = sendMessageInCs
      //   if (isBG) {
      //     sendFn = sendMessageInBg
      //   }
      //   const res = await sendFn(WebextEvent.getTabCapturePermission, null)
      //   if (!res) {
      //     newConfig.notSameOriginIframeCaptureModePriority =
      //       oldConfig.notSameOriginIframeCaptureModePriority
      //     newConfig.docPIP_renderType = oldConfig.docPIP_renderType
      //   }
      // }

      if (newConfig.useDocPIP) {
        if (!window?.documentPictureInPicture) {
          delete (newConfig as any).useDocPIP
          alert(t('settingPanel.unsupportDocPIPTips'))
        }
      }
      setBrowserSyncStorage(DM_MINI_PLAYER_CONFIG, newConfig)

      oldConfig = { ...oldConfig, ...newConfig }
    },
    async onInitLoadConfig(config) {
      if (!isPluginEnv) return config
      // 这里去掉as any会触发ts的循环type错误
      const savedConfig = (await getBrowserSyncStorage(
        DM_MINI_PLAYER_CONFIG
      )) as any

      const loadedConfig = { ...config, ...(savedConfig ?? {}) }
      oldConfig = loadedConfig
      return loadedConfig
    },
    useShadowDom: true,
  })
let oldConfig: typeof configStore

// 同步多个tab的config
if (isPluginEnv) {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return

    const config = await getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG)
    if (!config) return
    if (window.__spSetSavedConfig) {
      window.__spSetSavedConfig(config)
    } else {
      Object.entries(config).forEach(([key, value]) => {
        ;(configStore as any)[key] = value
      })
    }
  })
}

window.configStore = configStore
window.openSettingPanel = openSettingPanel

let firstChange = true
// 同步icon栏的修改隐藏floatButton
mobx.autorun(() => {
  const val = !configStore.floatButtonVisible
  // 第一次的值是不对的
  if (firstChange) {
    firstChange = false
    return
  }
  setBrowserSyncStorage(FLOAT_BTN_HIDDEN, val)
})
useBrowserSyncStorage(FLOAT_BTN_HIDDEN, async (val) => {
  if (isUndefined(val)) return
  const config = await getBrowserSyncStorage(DM_MINI_PLAYER_CONFIG)

  if (!config) return
  if (window.__spSetSavedConfig) {
    window.__spSetSavedConfig({ ...config, floatButtonVisible: !val })
  } else {
    configStore.floatButtonVisible = !val
  }
})

export default configStore
