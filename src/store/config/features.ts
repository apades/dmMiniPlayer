import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.features')
const config: typeof _config = (props) => ({ ...props, category })

const config_features = {
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
  bp_danmaku: config({
    label: t('shortcut.show/hideDanmaku'),
    defaultValue: true,
  }),
  bp_danmakuInput: config({
    label: t('shortcut.popupDanmakuInput'),
    defaultValue: true,
  }),
  bp_playbackRate: config({
    label: t('settingPanel.bpPlaybackRate'),
    defaultValue: true,
  }),
  bp_resize: config({
    label: t('settingPanel.bpResize'),
    defaultValue: true,
  }),
  keyboardTips_show: config({
    label: t('shortcut.showShortcutTips'),
    defaultValue: true,
  }),
  bp_volume: config({
    label: t('shortcut.cate_volume'),
    defaultValue: true,
  }),
  bp_sharpening: config({
    label: t('settingPanel.bpSharpening' as any),
    defaultValue: true,
  }),
}

export default config_features
