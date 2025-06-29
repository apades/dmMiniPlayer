import { HtmlDanmakuProvider } from '@root/core/WebProvider'
import { dq1 } from '@root/utils'

/**
 * ? 还需要解决页面最小化时，视频开始掉帧问题(还需要观测，下面的视窗监听在另一台电脑没有复现)
 * DONE 还需要解决页面最小化时，html弹幕不载入
 * 
 * 目前试了devtools的visibilitychange blur全部移除也不行，可能他加了视窗监听
 * 已观察到的，在上面清除操作后窗口挂着，另一个浏览器窗口在非最大化下没有TODO的问题
 * 
 * /live-schema.*.js e.ChatMessage = function(){} 处理消息
 * 
 * 1: ["common", c.webcast.im.Common.decode, 1],
  2: ["user", c.webcast.data.User.decode, 1],
  3: ["content", e.string, 0],
  4: ["visible_to_sender", e.bool, 0],
  5: ["background_image", c.webcast.data.Image.decode, 1],
  6: ["full_screen_text_color", e.string, 0],
  7: ["background_image_v2", c.webcast.data.Image.decode, 1],
  9: ["public_area_common", c.webcast.im.PublicAreaCommon.decode, 1],
  10: ["gift_image", c.webcast.data.Image.decode, 1],
  11: ["agree_msg_id", e.int64String, 0],
  12: ["priority_level", e.int32, 0],
  13: ["landscape_area_common", c.webcast.im.LandscapeAreaCommon.decode, 1],
  15: ["event_time", e.int64String, 0],
  16: ["send_review", e.bool, 0],
  17: ["from_intercom", e.bool, 0],
  18: ["intercom_hide_user_card", e.bool, 0],
  19: ["chat_tags", e.int32, 6],
  20: ["chat_by", e.int64String, 0],
  21: ["individual_chat_priority", e.int32, 0],
  40: ["rtf_content", c.webcast.data.Text.decode, 1],
  41: ["rtf_content_v2", c.webcast.data.Text.decode, 1]

  content是弹幕内容
 */
export default class DouyinProvider extends HtmlDanmakuProvider {
  isLive = true
  getObserveHtmlDanmakuConfig() {
    return {
      container: dq1<HTMLDivElement>(
        '.webcast-chatroom___list>div:first-child>div:first-child',
      )!,
      child: '*',
      text: '.webcast-chatroom___content-with-emoji-text',
    }
  }
  getDanmakuSenderConfig() {
    // TODO 不好修复，抖音换了个富文本编辑器，不像之前的简单编辑textContent就可行的
    return {
      webTextInput: dq1<HTMLInputElement>(
        '.webcast-chatroom___input-container textarea',
      )!,
      webSendButton: '.webcast-chatroom___send-btn',
    }
  }
}
