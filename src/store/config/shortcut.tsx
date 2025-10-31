import type { config as _config } from '@apad/setting-panel'
import { Key, keyCodeToCode, keyToKeyCodeMap } from '@root/types/key'
import { t } from '@root/utils/i18n'

const category = t('shortcut.shortcut')
const config: typeof _config = (props) => ({
  category,
  render: ((val: Key[], onChange: (val: Key[]) => void) => {
    return (
      <input
        value={val.join(' + ')}
        onKeyDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const { keyCode, shiftKey, ctrlKey } = e

          const actions: Key[] = []
          if (!keyCode) return
          if (shiftKey && keyCode !== keyToKeyCodeMap.Shift)
            actions.push('Shift')
          if (ctrlKey && keyCode !== keyToKeyCodeMap.Ctrl) actions.push('Ctrl')

          actions.push(...formatKeys((keyCodeToCode as any)[keyCode]))

          if (keyCode === keyToKeyCodeMap.Backspace) {
            actions.length = 0
          }
          onChange(actions)
        }}
        onChange={() => {}}
      />
    )
  }) as any,
  ...props,
})

export const disableRender = (val: Key[]) => (
  <input
    value={val.join(' + ')}
    disabled
    style={{ cursor: 'not-allowed' }}
    onChange={() => {}}
  />
)

export const formatKeys = (...keys: Key[]): Key[] =>
  keys.map((key) => {
    switch (key) {
      case 'ArrowLeft':
        return '←'
      case 'ArrowRight':
        return '→'
      case 'ArrowUp':
        return '↑'
      case 'ArrowDown':
        return '↓'
    }
    return key
  })

const keys = (...keys: Key[]) => formatKeys(...keys) as Key[]

const cateProgress = t('shortcut.cate_progress'),
  cateSpeed = t('shortcut.cate_speed'),
  cateVolume = t('shortcut.cate_volume')

const config_shortcut = {
  shortcut_playToggle: config({
    label: t('shortcut.play/pause'),
    defaultValue: keys('Space'),
    ext: cateProgress,
  }),
  shortcut_rewind: config({
    label: t('shortcut.rewind'),
    defaultValue: keys('ArrowLeft'),
    render: disableRender,
    ext: cateProgress,
  }),
  shortcut_forward: config({
    label: t('shortcut.forward'),
    defaultValue: keys('ArrowRight'),
    render: disableRender,
    ext: cateProgress,
  }),
  shortcut_fineRewind: config({
    label: t('shortcut.rewind_fine'),
    defaultValue: keys('Shift', 'ArrowLeft'),
    ext: cateProgress,
  }),
  shortcut_fineForward: config({
    label: t('shortcut.forward_fine'),
    defaultValue: keys('Shift', 'ArrowRight'),
    ext: cateProgress,
  }),
  shortcut_preVideo: config({
    label: t('shortcut.preVideo'),
    defaultValue: keys('Ctrl', 'Alt', 'ArrowLeft'),
    ext: cateProgress,
  }),
  shortcut_nextVideo: config({
    label: t('shortcut.nextVideo'),
    defaultValue: keys('Ctrl', 'Alt', 'ArrowRight'),
    ext: cateProgress,
  }),
  shortcut_volumeUp: config({
    label: t('shortcut.volumeUp'),
    defaultValue: keys('ArrowUp'),
    ext: cateVolume,
  }),
  shortcut_volumeDown: config({
    label: t('shortcut.volumeDown'),
    defaultValue: keys('ArrowDown'),
    ext: cateVolume,
  }),
  shortcut_muteToggle: config({
    label: t('shortcut.mute/unmute'),
    defaultValue: keys('M'),
    ext: cateVolume,
  }),
  shortcut_danmakuVisible: config({
    label: t('shortcut.show/hideDanmaku'),
    defaultValue: keys('D'),
  }),
  shortcut_subtitleVisible: config({
    label: t('shortcut.show/hideSubtitle'),
    defaultValue: keys('S'),
  }),
  shortcut_speedUp: config({
    label: t('shortcut.speedUp'),
    defaultValue: keys('='),
    ext: cateSpeed,
  }),
  shortcut_speedDown: config({
    label: t('shortcut.speedDown'),
    defaultValue: keys('-'),
    ext: cateSpeed,
  }),
  shortcut_speedToggle: config({
    label: t('shortcut.speedMode/normal'),
    defaultValue: keys('0'),
    ext: cateSpeed,
  }),
  shortcut_pressSpeedMode: config({
    label: t('shortcut.speedMode'),
    defaultValue: keys(t('shortcut.longPress') as any, 'ArrowRight'),
    render: disableRender,
    ext: cateSpeed,
  }),
  shortcut_screenshot: config({
    label: t('shortcut.screenshot'),
    defaultValue: keys('Shift', 'P'),
  }),
  shortcut_danmakuShowInput: config({
    label: t('shortcut.popupDanmakuInput'),
    defaultValue: keys('Enter'),
  }),
  shortcut_sizeUpdate: config({
    label: t('shortcut.sizeUpdate'),
    defaultValue: keys('Ctrl', t('shortcut.wheel') as any),
    render: disableRender,
  }),
  shortcut_autoResize: config({
    label: t('settingPanel.bpResize'),
    defaultValue: keys('R'),
  }),
} as const

export default config_shortcut
