import { type VideoItem } from '@root/components/VideoPlayer/Side'
import { SideSwitcher } from '@root/core/SideSwitcher'
import { WebProvider } from '@root/core/WebProvider'
import onRouteChange from '@root/inject/csUtils/onRouteChange'
import { dq, dq1, wait } from '@root/utils'

export default class DdrkProvider extends WebProvider {
  override onInit(): void {
    this.sideSwitcher = new SideSwitcher()
  }

  override onPlayerInitd(): void {
    this.initSideSwitcherData()

    this.addOnUnloadFn(
      onRouteChange(() => {
        this.clickButtonToAppendSrcInVideoTag()
      }),
    )
  }

  clickButtonToAppendSrcInVideoTag() {
    wait(500).then(() => {
      const btn = dq1('.vjs-big-play-button')
      if (!btn) throw new Error('没有找到按钮')
      btn?.click?.()
    })
  }

  async initSideSwitcherData() {
    const videoPElList = dq('.wp-playlist-item')
    const videoPItems: VideoItem[] = videoPElList.map((el) => {
      return {
        el,
        link: '',
        linkEl: el,
        title: (el.textContent ?? '').trim(),
        isActive: el.classList.contains('wp-playlist-playing'),
      }
    })

    this.sideSwitcher?.init([
      { category: '视频分P', items: videoPItems, mainList: true },
    ])
  }
}
