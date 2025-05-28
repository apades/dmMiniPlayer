import type { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.specialWebsites')
const config: typeof _config = (props) => ({ ...props, category })

const config_specialWebsites = {
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

  youtube_mergeSubtitleAtSimilarTimes: config({
    defaultValue: true,
    label: t('settingPanel.youtube_mergeSubtitleAtSimilarTimes'),
  }),
  // biliLiveSide: config({
  //   defaultValue: false,
  //   label: t('settingPanel.biliLiveSide'),
  //   desc: t('settingPanel.biliLiveSideDesc'),
  // }),
}

export default config_specialWebsites
