import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.subtitle')
const config: typeof _config = (props) => ({ ...props, category })

const config_subtitle = {
  subtitle_opacity: config({
    label: t('settingPanel.subtitleOpacity'),
    defaultValue: 1,
  }),
  subtitle_bg: config({
    label: t('settingPanel.subtitleBg'),
    type: 'color',
    defaultValue: '#000000',
  }),
  subtitle_bgOpacity: config({
    label: t('settingPanel.subtitleBgOpacity'),
    defaultValue: 0.3,
  }),
  subtitle_fontSize: config({
    label: t('settingPanel.subtitleFontSize'),
    defaultValue: 14,
  }),
  subtitle_fontColor: config({
    label: t('settingPanel.subtitleFontColor'),
    type: 'color',
    defaultValue: '#ffffff',
  }),
  subtitle_fontWeight: config({
    label: t('settingPanel.subtitleFontWeight'),
    defaultValue: 400,
  }),
  subtitle_fontOpacity: config({
    label: t('settingPanel.subtitleFontOpacity'),
    defaultValue: 1,
  }),
  subtitle_fontFamily: config({
    label: t('settingPanel.subtitleFontFamily'),
    defaultValue: 'arial, microsoft yahei, pingfangsc ,helvetica, sans-serif',
  }),
}

export default config_subtitle
