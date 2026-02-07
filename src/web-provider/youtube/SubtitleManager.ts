import SubtitleDomCaptureManager from '@root/core/SubtitleManager/SubtitleDomCaptureManager'
import { tryCatch } from '@root/utils'
import { ExtractPromise } from '@root/utils/typeUtils'
import { getVideoInfo } from './utils'

export default class YoutubeSubtitleManager extends SubtitleDomCaptureManager {
  override async getConfig(): ExtractPromise<
    ReturnType<SubtitleDomCaptureManager['getConfig']>
  > {
    const [error, hasSubtitle] = await tryCatch(
      async () =>
        !!(await getVideoInfo()).captions.playerCaptionsTracklistRenderer
          .captionTracks,
    )

    if (!hasSubtitle || error) return []

    return [
      {
        type: 'event',
        event: new MouseEvent('mousemove', { bubbles: true }),
        targetEl: '.html5-video-player',
      },
      {
        type: 'event',
        event: new MouseEvent('click', { bubbles: true }),
        targetEl: '[data-tooltip-target-id="ytp-settings-button"]',
      },
      {
        type: 'event',
        event: new MouseEvent('click', { bubbles: true }),
        targetEl:
          '.ytp-popup.ytp-settings-menu .ytp-menuitem:nth-last-child(4)',
        wait: 1000,
      },
      {
        type: 'subtitleElList',
        container: '.ytp-panel-menu',
        isActive: '[aria-checked="false"]',
        filter(list) {
          const [l1, ...rlist] = list
          return rlist
        },
      },
      {
        type: 'subtitleDom',
        targetEls: [
          {
            container: '.ytp-caption-window-container',
            el: '.caption-window.ytp-caption-window-bottom',
          },
        ],
      },
    ]
  }
}
