import { VIDEO_ID_ATTR } from '@root/shared/config'
import PostMessageEvent from '@root/shared/postMessageEvent'
import { dq, getVideoElInitFloatButtonData, uuid } from '@root/utils'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'
import { initVideoFloatBtn } from '../floatButton'

export default function runOnAllIframeMain() {
  onPostMessage(PostMessageEvent.detectVideo_req, () => {
    postMessageToTop(
      PostMessageEvent.detectVideo_resp,
      dq('video').map((v, i) => {
        initVideoFloatBtn(...getVideoElInitFloatButtonData(v))
        let id = v.getAttribute(VIDEO_ID_ATTR)
        if (!id) {
          id = uuid()
          v.setAttribute(VIDEO_ID_ATTR, id)
        }
        return {
          id,
          w: v.clientWidth,
          h: v.clientHeight,
          isMute: v.muted,
          isPlaying: !v.paused,
        }
      }),
    )
  })
}
