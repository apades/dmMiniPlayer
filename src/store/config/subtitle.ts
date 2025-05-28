import type { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.subtitle')
const config: typeof _config = (props) => ({ ...props, category })

const config_subtitle = {
  subtitle_opacity: config({
    label: t('settingPanel.subtitleOpacity'),
    defaultValue: 1,
    type: 'range',
    range: [0, 1],
  }),
  subtitle_bg: config({
    label: t('settingPanel.subtitleBg'),
    type: 'color',
    defaultValue: '#000000',
  }),
  subtitle_bgOpacity: config({
    label: t('settingPanel.subtitleBgOpacity'),
    defaultValue: 0.3,
    type: 'range',
    range: [0, 1],
  }),
  subtitle_fontSize: config({
    label: t('settingPanel.subtitleFontSize'),
    defaultValue: 16,
    type: 'range',
    range: [12, 32],
    rangeStep: 1,
  }),
  subtitle_fontColor: config({
    label: t('settingPanel.subtitleFontColor'),
    type: 'color',
    defaultValue: '#ffffff',
  }),
  subtitle_fontWeight: config({
    label: t('settingPanel.subtitleFontWeight'),
    defaultValue: 600,
  }),
  subtitle_fontOpacity: config({
    label: t('settingPanel.subtitleFontOpacity'),
    defaultValue: 1,
    type: 'range',
    range: [0, 1],
  }),
  subtitle_fontFamily: config({
    label: t('settingPanel.subtitleFontFamily'),
    defaultValue: 'arial, microsoft yahei, pingfangsc ,helvetica, sans-serif',
  }),

  subtitle_autoSize: config({
    defaultValue: true,
    label: t('settingPanel.adjustFontsizeByPIPWidthResize'),
    desc: t('settingPanel.subtitleAutoSizeDesc'),
  }),
  subtitle_autoSize_startWidth: config({
    defaultValue: 500,
    label: t('settingPanel.adjustFontsizeStartWidth'),
    relateBy: 'subtitle_autoSize',
    relateByValue: true,
  }),
  subtitle_autoSize_scaleRate: config({
    defaultValue: 0.8,
    label: t('settingPanel.adjustFontsizeScaleRate'),
    relateBy: 'subtitle_autoSize',
    relateByValue: true,
  }),
  subtitle_autoSize_maxSize: config({
    defaultValue: 48,
    label: t('settingPanel.adjustFontsizeMaxSize'),
    relateBy: 'subtitle_autoSize',
    relateByValue: true,
  }),
}

export default config_subtitle
