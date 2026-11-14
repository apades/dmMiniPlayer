import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.specialWebsites')
const config: typeof _config = (props) => ({ ...props, category })

export enum BiliDanmakuMode {
  api = 'api',
  html = 'html',
}

const config_specialWebsites = {
  biliVideoDanmakuMode: config<BiliDanmakuMode>({
    defaultValue: BiliDanmakuMode.api,
    label: t('settingPanel.biliVideoDanmakuMode'),
    desc: t('settingPanel.biliVideoDanmakuModeDesc'),
    type: 'group',
    group: [
      {
        value: BiliDanmakuMode.api,
        label: t('settingPanel.biliDanmakuMode_api'),
      },
      {
        value: BiliDanmakuMode.html,
        label: t('settingPanel.biliDanmakuMode_html'),
      },
    ],
  }),
  biliLiveDanmakuMode: config<BiliDanmakuMode>({
    defaultValue: BiliDanmakuMode.api,
    label: t('settingPanel.biliLiveDanmakuMode'),
    desc: t('settingPanel.biliLiveDanmakuModeDesc'),
    type: 'group',
    group: [
      {
        value: BiliDanmakuMode.api,
        label: t('settingPanel.biliDanmakuMode_api'),
      },
      {
        value: BiliDanmakuMode.html,
        label: t('settingPanel.biliDanmakuMode_html'),
      },
    ],
  }),
  biliVideoDansFromBiliEvaolved: config({
    defaultValue: false,
    label: t('settingPanel.biliVideoDansFromBiliEvaolved'),
    desc: t('settingPanel.biliVideoDansFromBiliEvaolvedDesc'),
    relateBy(settings) {
      return settings.biliVideoDanmakuMode === BiliDanmakuMode.api
    },
  }),
  biliVideoPakkuFilter: config({
    defaultValue: true,
    label: t('settingPanel.biliVideoPakkuFilter'),
    desc: t('settingPanel.biliVideoPakkuFilterDesc'),
    relateBy(settings) {
      return (
        settings.biliVideoDanmakuMode === BiliDanmakuMode.api &&
        !!settings.biliVideoDansFromBiliEvaolved
      )
    },
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
