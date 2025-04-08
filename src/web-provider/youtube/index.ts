import { dq, dq1, formatTime, throttle } from '@root/utils'
import { HtmlDanmakuProvider, WebProvider } from '@root/core/WebProvider'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import { SideSwitcher } from '@root/core/SideSwitcher'
import { t } from '@root/utils/i18n'
import { VideoItem } from '@root/components/VideoPlayer/Side'
import configStore from '@root/store/config'
import YoutubePreviewManager from './PreviewManager'
import YoutubeSubtitleManager from './SubtitleManager'

const getIframe = () => dq1<HTMLIFrameElement>('.ytd-live-chat-frame')
const getLiveClass = () => dq1<HTMLDivElement>('.ytp-live')
const isLive = () =>
  configStore.useIframeToDetectIsLiveOnYoutube
    ? !!getIframe()
    : !!getLiveClass()
export default class YoutubeProvider extends HtmlDanmakuProvider {
  onInit() {
    super.onInit()
    this.isLive = isLive()

    this.subtitleManager = new YoutubeSubtitleManager()
    this.sideSwitcher = new SideSwitcher()
    if (!this.isLive) {
      this.videoPreviewManager = new YoutubePreviewManager()
    }
  }

  async onPlayerInitd() {
    this.initSideSwitcherData()

    const listDom = dq1('ytd-watch-next-secondary-results-renderer')
    if (listDom) {
      const initSideSwitcherData = throttle(() => {
        this.initSideSwitcherData()
      }, 500)
      const ob = new MutationObserver((e) => {
        initSideSwitcherData()
        this.update()
      })
      ob.observe(listDom, { attributes: true })

      this.addOnUnloadFn(() => {
        ob.disconnect()
      })
    } else {
      // 保底采用history模式，但会有些问题
      this.addOnUnloadFn(
        onRouteChange(() => {
          setTimeout(() => {
            this.update()
            this.initSideSwitcherData()
          }, 0)
        }),
      )
    }
  }

  update() {
    this.subtitleManager.init(this.webVideo)
    if (this.videoPreviewManager) {
      this.videoPreviewManager.init(this.webVideo)
    }
  }

  getObserveHtmlDanmakuConfig() {
    return {
      container: dq1<HTMLElement>(
        '#items.yt-live-chat-item-list-renderer',
        getIframe()?.contentDocument,
      )!,
      child: 'yt-live-chat-text-message-renderer',
      text: '#message',
    }
  }
  getDanmakuSenderConfig() {
    const dqTar = getIframe()?.contentDocument
    return {
      webTextInput: dq1<HTMLInputElement>(
        '#input.yt-live-chat-text-input-field-renderer',
        dqTar,
      ),
      webSendButton: dq1(
        '.yt-live-chat-message-input-renderer .yt-spec-button-shape-next',
        dqTar,
      ),
    }
  }

  async initSideSwitcherData() {
    if (!this.sideSwitcher) {
      console.error('已经被unload了', this)
      throw Error('已经被unload了')
    }

    const playListItems: VideoItem[] = dq(
      'ytd-playlist-panel-video-renderer',
    ).map((el) => {
      const title = (dq1('#video-title', el)?.textContent ?? '').trim()
      return {
        el,
        link: '',
        linkEl: dq1('a', el)!,
        title,
        isActive: el.hasAttribute('selected'),
        cover: dq1<HTMLImageElement>('.ytd-thumbnail img', el)?.src,
        duration:
          dq1('.ytd-thumbnail-overlay-time-status-renderer', el)?.textContent ??
          '',
      }
    })

    const recommendedListItems: VideoItem[] = dq(
      'ytd-compact-video-renderer',
    ).map((el) => {
      const title = (dq1('#video-title', el)?.textContent ?? '').trim()
      return {
        el,
        link: '',
        linkEl: dq1('a', el)!,
        title,
        cover: dq1<HTMLImageElement>('.ytd-thumbnail img', el)?.src,
        user: dq1('.ytd-channel-name', el)?.textContent?.trim() ?? '',
        duration:
          dq1('.ytd-thumbnail-overlay-time-status-renderer', el)?.textContent ??
          '',
      }
    })

    // console.log('data', playListItems, recommendedListItems)
    this.sideSwitcher.init([
      {
        category: t('vp.playList'),
        items: playListItems,
      },
      {
        category: t('vp.recommendedList'),
        items: recommendedListItems,
      },
    ])
  }
}
