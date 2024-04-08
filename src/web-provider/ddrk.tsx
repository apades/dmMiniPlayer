import VideoPlayerSide, {
  type VideoItem,
} from '@root/components/VideoPlayer/Side'
import DocMiniPlayer from '@root/core/DocMiniPlayer'
import { useOnce } from '@root/hook'
import { offMessage, onMessage, sendMessage } from '@root/inject/contentSender'
import { dq, dq1, wait } from '@root/utils'
import { windowsOnceCall } from '@root/utils/decorator'
import { useState } from 'react'
import WebProvider from './webProvider'
import type { MiniPlayerProps } from '@root/core/miniPlayer'

export default class DdrkProvider extends WebProvider {
  inPIPPlayMode = false
  constructor() {
    super()
    this.injectHistoryChange()
  }
  protected async initMiniPlayer(options?: MiniPlayerProps) {
    const miniPlayer = await super.initMiniPlayer(options)

    this.miniPlayer = miniPlayer
    miniPlayer.on('PIPOpen', () => {
      this.inPIPPlayMode = true
    })
    miniPlayer.on('PIPClose', () => {
      this.inPIPPlayMode = false
    })

    if (miniPlayer instanceof DocMiniPlayer) {
      this.initSideActionAreaRender(miniPlayer)
    }

    return miniPlayer
  }

  @windowsOnceCall('ddrk_history')
  injectHistoryChange() {
    sendMessage('inject-api:run', {
      origin: 'history',
      keys: ['pushState', 'forward', 'replaceState'],
      onTriggerEvent: 'history',
    })
    onMessage('inject-api:onTrigger', (data) => {
      if (data.event != 'history') return null
      console.log('切换了路由 history')
      if (this.inPIPPlayMode) {
        this.clickButtonToAppendSrcInVideoTag()
      }
    })
    window.addEventListener('popstate', () => {
      console.log('切换了路由 popstate')
      if (this.inPIPPlayMode) {
        this.clickButtonToAppendSrcInVideoTag()
      }
    })
  }

  clickButtonToAppendSrcInVideoTag() {
    wait(500).then(() => {
      const btn = dq1('.vjs-big-play-button')
      if (!btn) throw new Error('没有找到按钮')
      btn?.click?.()
    })
  }

  initSideActionAreaRender(miniPlayer: DocMiniPlayer) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const webProvider = this
    function Side() {
      const videoPElList = dq('.wp-playlist-item')
      const videoPItems: VideoItem[] = videoPElList.map((el) => {
        return {
          el,
          link: '',
          linkEl: el,
          title: el.textContent,
          isActive: el.classList.contains('wp-playlist-playing'),
        }
      })
      const [count, setCount] = useState(0)

      useOnce(() => {
        const handleLocationChange = (data: any): any => {
          if (data?.event != 'history') return null
          setCount((i) => ++i)
        }

        onMessage('inject-api:onTrigger', handleLocationChange)
        window.addEventListener('popstate', handleLocationChange)

        return () => {
          offMessage('inject-api:onTrigger', handleLocationChange)
          window.removeEventListener('popstate', handleLocationChange)
        }
      })

      return (
        <VideoPlayerSide
          videoList={[{ category: '视频分P', items: videoPItems }]}
          webProvider={webProvider}
        />
      )
    }

    miniPlayer.renderSideActionArea = () => <Side />
  }
}
