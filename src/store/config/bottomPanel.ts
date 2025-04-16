import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.bottomPanel')
const config: typeof _config = (props) => ({ ...props, category })

const config_bottomPanel = {
  bp_preVideo: config({
    label: t('shortcut.preVideo'),
    defaultValue: true,
  }),
  bp_playToggle: config({
    label: t('shortcut.play/pause'),
    defaultValue: true,
  }),
  bp_nextVideo: config({
    label: t('shortcut.nextVideo'),
    defaultValue: true,
  }),
  bp_subtitle: config({
    label: t('shortcut.show/hideSubtitle'),
    defaultValue: true,
  }),
}

export default config_bottomPanel
