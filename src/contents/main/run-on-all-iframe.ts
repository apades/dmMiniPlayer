import PostMessageEvent from '@root/shared/postMessageEvent'
import { dq } from '@root/utils'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'

export default function runOnAllIframeMain() {
  onPostMessage(PostMessageEvent.detectVideo_req, () => {
    postMessageToTop(
      PostMessageEvent.detectVideo_resp,
      dq('video').map((v, i) => {
        return {
          id: v.getAttribute('data-dm-vid') || '',
          w: v.clientWidth,
          h: v.clientHeight,
          isMute: v.muted,
          isPlaying: !v.paused,
        }
      }),
    )
  })
}
