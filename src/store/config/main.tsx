import { config } from '@apad/setting-panel'
import { getNowLang, Language, LanguageNativeNames, t } from '@root/utils/i18n'
import configStore, { saveConfig, updateConfig } from '.'

export enum videoBorderType {
  default = 'default',
  width = 'width',
  height = 'height',
}

export enum ReplacerDbClickAction {
  none = 'none',
  fullscreen = 'fullscreen',
  fullpage = 'fullpage',
}

export enum SideTriggerType {
  hidden = 'hidden',
  hover = 'hover',
  click = 'click',
}

const config_main = {
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
  sideTrigger: config<SideTriggerType>({
    defaultValue: SideTriggerType.hover,
    label: t('settingPanel.sideTrigger'),
    type: 'group',
    group: [
      { label: t('hidden'), value: SideTriggerType.hidden },
      { label: t('hover'), value: SideTriggerType.hover },
      { label: t('click'), value: SideTriggerType.click },
    ],
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
  disable_scrollToChangeVolume: config({
    defaultValue: false,
    label: t('settingPanel.disable_scrollToChangeVolume'),
  }),
  // pauseInClose_live: config({
  //   defaultValue: false,
  //   label: t('settingPanel.pauseInClose_live'),
  //   desc: t('settingPanel.pauseInClose_liveDesc'),
  //   relateBy: 'pauseInClose_video',
  //   relateByValue: true,
  // }),
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
  disable_sites: config({
    defaultValue: [] as string[],
    label: t('settingPanel.disableSites'),
    desc: t('settingPanel.disableSitesTips'),
  }),
  // eventInject_sites: config({
  //   defaultValue: DEFAULT_EVENT_INJECT_SITE,
  //   notRecommended: true,
  // }),
  showDebugInfo: config({
    defaultValue: false,
    notRecommended: true,
  }),
  showReplacerBtn: config({
    defaultValue: false,
    label: t('settingPanel.showReplacerBtn'),
    desc: t('settingPanel.showReplacerBtnDesc'),
  }),
  replacerDbClickAction: config<ReplacerDbClickAction>({
    label: t('settingPanel.replacerDbClickAction'),
    defaultValue: ReplacerDbClickAction.fullscreen,
    type: 'group',
    group: [
      { value: ReplacerDbClickAction.none, label: t('shortcut.none') },
      {
        value: ReplacerDbClickAction.fullscreen,
        label: t('shortcut.fullscreen'),
      },
      { value: ReplacerDbClickAction.fullpage, label: t('shortcut.fullpage') },
    ],
    relateBy: 'showReplacerBtn',
    relateByValue: true,
  }),
  exportImportSettings: config({
    defaultValue: '',
    label: t('settingPanel.exportImportSettings' as any),
    render: () => {
      const btnStyle = {
        padding: '4px 12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        cursor: 'pointer',
        fontSize: '13px',
        background: '#f5f5f5',
      }
      const handleExport = () => {
        const data = JSON.stringify(configStore, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dmMiniPlayer-settings-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
      const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) return
          try {
            const text = await file.text()
            const data = JSON.parse(text)
            if (typeof data !== 'object' || data === null) {
              throw new Error('invalid')
            }
            updateConfig(data)
            saveConfig()
            alert(t('settingPanel.importSuccess'))
            location.reload()
          } catch {
            alert(t('settingPanel.importError'))
          }
        }
        input.click()
      }
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExport} style={btnStyle}>
            {t('settingPanel.exportSettings')}
          </button>
          <button onClick={handleImport} style={btnStyle}>
            {t('settingPanel.importSettings')}
          </button>
        </div>
      )
    },
  }),
}

export default config_main
