import { getBiliBiliVideoDanmu } from '@root/danmaku/bilibili/videoBarrageClient/bilibili-api'
import { dq1, onceCall } from '@root/utils'
import { defineSiteAdapter } from '../../core/site-adapter'
import {
  getSubtitle,
  getSubtitles,
  getVideoInfoFromUrl,
} from './bilibili-helpers'
import {
  PreviewManager,
  onMediaUpdated as onMediaUpdatedWithPreviewManager,
} from './bilibili-preview'
import { SideSwitcher } from './bilibili-side'

const getDanmakus = onceCall(async (aid: string, cid: string) => {
  return getBiliBiliVideoDanmu(cid)
})

export default defineSiteAdapter({
  name: 'bilibili-video',
  match: 'https://www.bilibili.com/*',
  injectPermissions: ['visibility'],
  onBeforePlayerMounted(ctx) {
    ctx.injection.visibility.alwaysVisible()
  },
  onPlayerDestroyed(ctx) {
    ctx.injection.visibility.restore()
  },
  onMediaUpdated() {
    onMediaUpdatedWithPreviewManager()
  },
  components: {
    DanmakuSender: {
      attach() {
        return {
          webTextInput: dq1<HTMLInputElement>('.bpx-player-dm-input')!,
          webSendButton: dq1<HTMLElement>('.bpx-player-dm-btn-send')!,
        }
      },
    },
    DanmakuEngine: {
      async attach() {
        const { aid, cid } = await getVideoInfoFromUrl(location.href)
        const danmakus = await getDanmakus(aid, cid)
        return danmakus
      },
    },
    SideSwitcher,
    VideoPreviewManager: PreviewManager,
    SubtitleManager: {
      attach: getSubtitles,
      async loadSubtitle(value) {
        const subtitleRes = await getSubtitle(value)
        return subtitleRes.body.map((d, i) => {
          return {
            endTime: d.to,
            startTime: d.from,
            htmlText: d.content,
            id: i + '',
            text: d.content,
          }
        })
      },
    },
  },
})
