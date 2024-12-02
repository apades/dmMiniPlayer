import { FC, useEffect, useMemo, useRef } from 'react'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import { WebProvider } from '.'
import { createPortal } from 'react-dom'
import { createElement } from '@root/utils'
import { PlayerEvent } from '../event'
import { createRoot } from 'react-dom/client'
import { useSize } from 'ahooks'
import { useOnce } from '@root/hook'
import ShadowRootContainer from '@root/components/ShadowRootContainer'
import { getDomAbsolutePosition } from '@root/utils/dom'

export default class ReplacerWebProvider extends WebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected MiniPlayer = HtmlVideoPlayer

  async onOpenPlayer() {
    await this.miniPlayer.init()

    // TODO 单视频和有视频容器的情况
    const videoOccupyEl = createElement('div', {
      style: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
      },
    })
    const webVideoParent = this.webVideo.parentElement
    if (!webVideoParent) throw Error('不正常的webVideoEl')
    webVideoParent.replaceChild(videoOccupyEl, this.webVideo)

    const VideoPlayerOuterContainer: FC = () => {
      const containerRef = useRef<HTMLDivElement>(null)
      const size = useSize(videoOccupyEl)
      const rect = useMemo(() => getDomAbsolutePosition(videoOccupyEl), [])

      useEffect(() => {
        this.emit(PlayerEvent.resize)
      }, [size])

      useOnce(() => {
        if (!containerRef.current) return
        // 弹幕器相关
        if (this.danmakuEngine) {
          const danmakuContainer = createElement('div', {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              pointerEvents: 'none',
            },
          })
          containerRef.current.appendChild(danmakuContainer)
          this.danmakuEngine.init({
            media: this.webVideo,
            container: danmakuContainer,
          })
        }
      })

      useOnce(() => {
        if (!containerRef.current) return
        const playerEl = this.miniPlayer.playerRootEl
        if (!playerEl) {
          console.error(
            '不正常的miniPlayer.init()，没有 playerEl',
            this.miniPlayer
          )
          throw Error('不正常的miniPlayer.init()')
        }
        containerRef.current.appendChild(playerEl)
      })

      return createPortal(
        <ShadowRootContainer>
          <div
            className="absolute"
            style={{
              left: rect.left,
              top: rect.top,
              width: size?.width,
              height: size?.height,
              zIndex: 99999999,
            }}
          >
            <div
              className="relative z-10 w-full h-full"
              ref={containerRef}
            ></div>
          </div>
        </ShadowRootContainer>,
        document.body
      )
    }

    const reactRoot = createRoot(createElement('div'))
    reactRoot.render(<VideoPlayerOuterContainer />)

    this.on(PlayerEvent.close, () => {
      reactRoot.unmount()
      webVideoParent.replaceChild(this.webVideo, videoOccupyEl)
    })
  }
}
