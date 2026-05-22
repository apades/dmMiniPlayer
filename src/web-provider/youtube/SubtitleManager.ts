import SubtitleDomCaptureManager from '@root/core/SubtitleManager/SubtitleDomCaptureManager'
import { dq } from '@root/utils'
import { ExtractPromise } from '@root/utils/typeUtils'

const SUBTITLE_MENU_TEXT_RE =
  /(字幕|字[幕]\/cc|字幕\/cc|subtitles?|captions?|closed captions?|cc|자막|sous-titres|subtítulos)/i

function getYoutubeSubtitleMenuItem() {
  const menuItems = dq<HTMLElement>(
    '.ytp-popup.ytp-settings-menu .ytp-menuitem',
  )

  return menuItems.find((item) => {
    const label =
      item
        .querySelector<HTMLElement>('.ytp-menuitem-label')
        ?.textContent?.trim() ||
      item.textContent?.trim() ||
      ''
    if (!label) return false
    return SUBTITLE_MENU_TEXT_RE.test(label)
  })
}

export default class YoutubeSubtitleManager extends SubtitleDomCaptureManager {
  #videoUrl = ''
  #videoListenerUnlisten = () => {}

  override async getConfig(): ExtractPromise<
    ReturnType<SubtitleDomCaptureManager['getConfig']>
  > {
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
        targetEl: getYoutubeSubtitleMenuItem,
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
            el: '.caption-window',
            text: '.ytp-caption-segment',
          },
        ],
      },
    ]
  }

  override async onInit() {
    await super.onInit()
    this.bindYoutubeVideoSwitchDetector()
  }

  private bindYoutubeVideoSwitchDetector() {
    this.#videoListenerUnlisten()
    const video = this.video
    if (!video) return

    this.#videoUrl = location.href
    let ended = false

    const markEnded = () => {
      ended = true
      this.markSubtitleDomStale('video-ended')
    }
    const refreshIfSwitched = () => {
      if (!ended) return
      const urlChanged = this.#videoUrl !== location.href
      const restarted = video.currentTime < 2 || !video.ended
      if (!urlChanged && !restarted) return
      ended = false
      this.#videoUrl = location.href
      this.refreshSubtitleDomWhenStale('video-switched')
    }

    video.addEventListener('ended', markEnded)
    video.addEventListener('loadedmetadata', refreshIfSwitched)
    video.addEventListener('playing', refreshIfSwitched)
    video.addEventListener('timeupdate', refreshIfSwitched)

    this.#videoListenerUnlisten = () => {
      video.removeEventListener('ended', markEnded)
      video.removeEventListener('loadedmetadata', refreshIfSwitched)
      video.removeEventListener('playing', refreshIfSwitched)
      video.removeEventListener('timeupdate', refreshIfSwitched)
      this.#videoListenerUnlisten = () => {}
    }
  }

  override async refresh(options?: Parameters<SubtitleDomCaptureManager['refresh']>[0]) {
    this.#videoListenerUnlisten()
    await super.refresh(options)
  }

  override unload(): void {
    this.#videoListenerUnlisten()
    super.unload()
  }
}
