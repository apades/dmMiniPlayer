import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = 'autoPIP'
const config: typeof _config = (props) => ({ ...props, category })

export enum AutoPIPPos {
  default = 'default',
  'top-left' = 'top-left',
  'top-right' = 'top-right',
  'bottom-left' = 'bottom-left',
  'bottom-right' = 'bottom-right',
}

const config_autoPIP = {
  autoPIP_inPageHide: config({
    label: t('settingPanel.autoPIPInPageHide'),
    defaultValue: false,
    desc: t('settingPanel.autoPIPInPageHideDesc'),
  }),
  autoPIP_inScrollToInvisible: config({
    label: t('settingPanel.autoPIPInScroll'),
    defaultValue: false,
    desc: t('settingPanel.autoPIPInScrollDesc'),
  }),
  // TODO alert tab permissions
  // autoPIP_forcePosition: config<AutoPIPPos>({
  //   defaultValue: AutoPIPPos.default,
  //   desc: 'Default position is your last saved position, set this to force autoPIP position',
  // }),
  // autoPIP_forceWidth: config({
  //   defaultValue: 0,
  //   desc: 'Default width is your last saved width, set this to force autoPIP width, 0 is saved width',
  // }),
}

export default config_autoPIP
