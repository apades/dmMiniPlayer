import { config as _config } from '@apad/setting-panel'
import { t } from '@root/utils/i18n'

const category = t('settingPanel.specialWebsites')
const config: typeof _config = (props) => ({ ...props, category })

const websiteDanmakuSetting = {
  danmaku_container: '',
  danmaku_child: '',
  danmaku_text: '',

  sender_input: '',
  sender_button: '',
}

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

  websiteDanmakuSetting: config<Record<string, typeof websiteDanmakuSetting>>({
    type: 'map',
    defaultValue: {
      'live.douyin.com': {
        danmaku_container: '.webcast-chatroom___items>div:first-child',
        danmaku_child: '.webcast-chatroom___item',
        danmaku_text: '.webcast-chatroom___content-with-emoji-text',
        sender_input: '.webcast-chatroom___input-container textarea',
        sender_button: '.webcast-chatroom___send-btn',
      },
      // twitch视频
      // 'www.twitch.tv/video/': {},
      // twitch直播
      '/^www\\.twitch\\.tv\\/(?!video\\/).*$/': {
        danmaku_container: '.chat-scrollable-area__message-container',
        danmaku_child: '*',
        danmaku_text:
          '.chat-line__message-container .chat-line__username-container ~ span:last-of-type',
        sender_input: '[data-a-target="chat-input"]',
        sender_button: '[data-a-target="chat-send-button"]',
      },
    },
    defaultItem: websiteDanmakuSetting,
    label: 'Website danmaku setting',
    desc: 'Set HTML danmaku and sender by querySelector',
  }),
  // biliLiveSide: config({
  //   defaultValue: false,
  //   label: t('settingPanel.biliLiveSide'),
  //   desc: t('settingPanel.biliLiveSideDesc'),
  // }),
}

export default config_specialWebsites
