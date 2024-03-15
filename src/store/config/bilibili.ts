import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = 'bilibili'
const config: typeof _config = (props) => ({ ...props, category })

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}

const config_bilibili = {
  biliVideoDansFromBiliEvaolved: config({
    defaultValue: false,
    label: t('settingPanel.biliVideoDansFromBiliEvaolved'),
    desc: t('settingPanel.biliVideoDansFromBiliEvaolvedDesc'),
  }),
  biliVideoPakkuFilter: config({
    defaultValue: true,
    label: t('settingPanel.biliVideoPakkuFilter'),
    desc: t('settingPanel.biliVideoPakkuFilterDesc'),
    relateBy: 'biliVideoDansFromBiliEvaolved',
    relateByValue: true,
  }),

  biliLiveSide: config({
    defaultValue: false,
    label: t('settingPanel.biliLiveSide'),
    desc: t('settingPanel.biliLiveSideDesc'),
  }),
}

export default config_bilibili
