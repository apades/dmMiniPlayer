import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.danmaku')
const config: typeof _config = (props) => ({ ...props, category })

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}

export enum SettingDanmakuEngine {
  Apades = 'Apades',
  IronKinoko = 'IronKinoko',
}

const config_danmaku = {
  useHtmlDanmaku: config({
    defaultValue: true,
    label: t('settingPanel.useHtmlDanmaku'),
    desc: t('settingPanel.useHtmlDanmakuDesc'),
  }),
  htmlDanmakuEngine: config<SettingDanmakuEngine>({
    defaultValue: SettingDanmakuEngine.Apades,
    label: t('settingPanel.htmlDanmakuEngine'),
    type: 'group',
    group: [
      {
        value: SettingDanmakuEngine.Apades,
        desc: t('settingPanel.htmlDanmakuEngine_Apades'),
      },
      {
        value: SettingDanmakuEngine.IronKinoko,
        desc: t('settingPanel.htmlDanmakuEngine_IronKinoko'),
      },
    ],
  }),
  fontShadow: config({
    defaultValue: false,
    label: t('settingPanel.fontShadow'),
    desc: t('settingPanel.fontShadowDesc'),
    relateBy: 'useHtmlDanmaku',
    relateByValue: false,
  }),
  // fps限制相关
  renderFPS: config({
    defaultValue: 60,
    label: t('settingPanel.renderFPS'),
    desc: t('settingPanel.renderFPSDesc'),
    relateBy: 'useHtmlDanmaku',
    relateByValue: false,
  }),
  danSpeed: config({
    defaultValue: 20,
    label: t('settingPanel.danSpeed'),
    desc: t('settingPanel.danSpeedDesc'),
  }),
  danVerticalSafeTime: config({
    defaultValue: 5,
    label: t('settingPanel.danVerticalSafeTime'),
  }),
  opacity: config({
    defaultValue: 1,
    label: t('settingPanel.opacity'),
    type: 'range',
    range: [0, 1],
  }),
  fontSize: config({
    defaultValue: 16,
    label: t('settingPanel.fontSize'),
    type: 'range',
    range: [12, 32],
    rangeStep: 1,
  }),
  fontWeight: config({
    defaultValue: 600,
    label: t('settingPanel.fontWeight'),
  }),
  fontFamily: config({
    defaultValue: 'Segoe UI Emoji, SimHei, "microsoft yahei", sans-serif',
    label: t('settingPanel.fontFamily'),
  }),
  gap: config({
    defaultValue: 4,
    label: t('settingPanel.gap'),
  }),
  maxTunnel: config<MaxTunnelType>({
    defaultValue: MaxTunnelType['1/2'],
    label: t('settingPanel.maxTunnel'),
    type: 'group',
    group: [MaxTunnelType['1/2'], MaxTunnelType['1/4'], MaxTunnelType.full],
  }),

  adjustFontsizeByPIPWidthResize: config({
    defaultValue: false,
    label: t('settingPanel.adjustFontsizeByPIPWidthResize'),
    desc: t('settingPanel.adjustFontsizeByPIPWidthResizeDesc'),
  }),
  adjustFontsizeStartWidth: config({
    defaultValue: 500,
    label: t('settingPanel.adjustFontsizeStartWidth'),
    desc: t('settingPanel.adjustFontsizeStartWidthDesc'),
    relateBy: 'adjustFontsizeByPIPWidthResize',
    relateByValue: true,
  }),
  adjustFontsizeScaleRate: config({
    defaultValue: 0.6,
    label: t('settingPanel.adjustFontsizeScaleRate'),
    desc: t('settingPanel.adjustFontsizeScaleRateDesc'),
    relateBy: 'adjustFontsizeByPIPWidthResize',
    relateByValue: true,
  }),
  adjustFontsizeMaxSize: config({
    defaultValue: 24,
    label: t('settingPanel.adjustFontsizeMaxSize'),
    desc: t('settingPanel.adjustFontsizeMaxSizeDesc'),
    relateBy: 'adjustFontsizeByPIPWidthResize',
    relateByValue: true,
  }),
}

export default config_danmaku
