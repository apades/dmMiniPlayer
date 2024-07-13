import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.danmaku')
const config: typeof _config = (props) => ({ ...props, category })

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}

const config_danmaku = {
  useHtmlDanmaku: config({
    defaultValue: false,
    desc: 'Reopen PIP in config changed',
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
    desc: t('settingPanel.opacityDesc'),
  }),
  fontSize: config({
    defaultValue: 16,
    label: t('settingPanel.fontSize'),
  }),
  fontWeight: config({
    defaultValue: 600,
    label: t('settingPanel.fontWeight'),
  }),
  fontFamily: config({
    defaultValue: 'Segoe UI Emoji, SimHei, "microsoft yahei", sans-serif',
    label: t('settingPanel.fontFamily'),
  }),
  fontShadow: config({
    defaultValue: false,
    label: t('settingPanel.fontShadow'),
    desc: t('settingPanel.fontShadowDesc'),
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
