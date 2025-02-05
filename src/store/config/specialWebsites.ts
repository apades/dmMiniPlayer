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
      'www.bilibili.com': {
        danmaku_container: '',
        danmaku_child: '',
        danmaku_text: '',
        sender_input: '.bpx-player-dm-input',
        sender_button: '.bpx-player-dm-btn-send',
      },
      'live.bilibili.com': {
        danmaku_container: '',
        danmaku_child: '',
        danmaku_text: '',
        sender_input:
          '.right-actions button || #chat-control-panel-vm .bottom-actions button',
        sender_button:
          '.chat-input-new textarea || #chat-control-panel-vm textarea',
      },
      // 斗鱼
      'www.douyu.com': {
        danmaku_container: '',
        danmaku_child: '',
        danmaku_text: '',
        sender_input: '.ChatSend-txt',
        sender_button: '.ChatSend-button',
      },
      // 抖音直播
      'live.douyin.com': {
        danmaku_container: '.webcast-chatroom___items>div:first-child',
        danmaku_child: '.webcast-chatroom___item',
        danmaku_text: '.webcast-chatroom___content-with-emoji-text',
        sender_input: '.webcast-chatroom___input-container textarea',
        sender_button: '.webcast-chatroom___send-btn',
      },
      // 动画疯
      'ani.gamer.com.tw': {
        danmaku_container: '',
        danmaku_child: '',
        danmaku_text: '',
        sender_input: '.danmu-text',
        sender_button: '.danmu-send_btn',
      },
      // twitch直播
      '/^www.twitch.tv\\/(?!video\\/).*$/': {
        danmaku_container: '.chat-scrollable-area__message-container',
        danmaku_child: '*',
        danmaku_text:
          '.chat-line__message-container .chat-line__username-container ~ span:last-of-type',
        sender_input: '[data-a-target="chat-input"]',
        sender_button: '[data-a-target="chat-send-button"]',
      },
      // twitch视频
      // 'www.twitch.tv/video/': {},
      'www.youtube.com': {
        danmaku_container: '#items.yt-live-chat-item-list-renderer',
        danmaku_child: 'yt-live-chat-text-message-renderer',
        danmaku_text: '#message',
        sender_input: '#input.yt-live-chat-text-input-field-renderer',
        sender_button:
          '.yt-live-chat-message-input-renderer .yt-spec-button-shape-next',
      },
      // 虎牙
      'www.huya.com': {
        danmaku_container: '#chat-room__list',
        danmaku_child: '*',
        danmaku_text: '.msg-normal .msg',
        sender_input: '#pub_msg_input',
        sender_button: '#msg_send_bt',
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
