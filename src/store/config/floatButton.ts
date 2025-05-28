import type { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.floatButton')
const config: typeof _config = (props) => ({ ...props, category })

export enum FloatButtonPos {
  leftTop = 'leftTop',
  rightTop = 'rightTop',
  leftBottom = 'leftBottom',
  rightBottom = 'rightBottom',
}

const config_floatButton = {
  floatButtonVisible: config({
    label: t('settingPanel.visible'),
    defaultValue: true,
  }),
  floatButtonPos: config<FloatButtonPos>({
    label: t('settingPanel.floatButtonPos'),
    type: 'group',
    group: [
      { label: t('settingPanel.leftTop'), value: FloatButtonPos.leftTop },
      { label: t('settingPanel.rightTop'), value: FloatButtonPos.rightTop },
      { label: t('settingPanel.leftBottom'), value: FloatButtonPos.leftBottom },
      {
        label: t('settingPanel.rightBottom'),
        value: FloatButtonPos.rightBottom,
      },
    ],
    defaultValue: FloatButtonPos.leftTop,
  }),
  floatButtonX: config({ label: 'X', defaultValue: 5 }),
  floatButtonY: config({ label: 'Y', defaultValue: 5 }),
}

export default config_floatButton
