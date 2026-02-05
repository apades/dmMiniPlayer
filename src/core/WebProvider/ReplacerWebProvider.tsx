import { FC, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  createElement,
  dq1,
  getVideoElInitFloatButtonData,
  isIframe,
  tryCatch,
} from '@root/utils'
import { createRoot } from 'react-dom/client'
import { useSize, useUpdate } from 'ahooks'
import { useOnce } from '@root/hook'
import AppRoot from '@root/components/AppRoot'
import { dqParents, getDomAbsolutePosition } from '@root/utils/dom'
import { sendMessage } from '@root/inject/contentSender'
import { onPostMessage } from '@root/utils/windowMessages'
import PostMessageEvent from '@root/shared/postMessageEvent'
import playerConfig from '@root/store/playerConfig'
import { PlayerEvent } from '../event'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import { WebProvider } from '.'

export default class ReplacerWebProvider extends WebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected override MiniPlayer = HtmlVideoPlayer

  override async onOpenPlayer() {
    const paused = this.webVideo.paused
    await this.miniPlayer.init()

    const videoEl = this.webVideo
    const { topContainerEl: topParentWithPosition, isFixedPos } = playerConfig

    const replacerParent = isFixedPos
      ? this.webVideo.parentElement
      : topParentWithPosition

    if (!replacerParent) throw Error('不正常的webVideoEl')

    const rect = getDomAbsolutePosition(this.webVideo)
    const VideoPlayerOuterContainer: FC = () => {
      const containerRef = useRef<HTMLDivElement>(null)
      const size = useSize(topParentWithPosition)
      const forceUpdate = useUpdate()

      useEffect(() => {
        this.emit(PlayerEvent.resize)
      }, [size])

      useOnce(() => {
        const stopPropagationKeyEvent = (e: Event) => {
          const target = e.target as HTMLElement
          const isShadowDom = target?.shadowRoot
          // shadowDom就放行
          if (isShadowDom) return
          e.stopPropagation()

          window.dispatchEvent(
            new CustomEvent(`dm-${e.type}`, {
              detail: e,
              bubbles: true,
            }),
          )
        }
        const shadowRootKeyEvent = (e: Event) => {
          window.dispatchEvent(
            new CustomEvent(`dm-${e.type}`, {
              detail: e,
              bubbles: true,
            }),
          )
        }

        const events: (keyof WindowEventMap)[] = [
          'keydown',
          'keyup',
          'keypress',
        ]

        events.forEach((event) => {
          // 发现只需要在body上阻止冒泡就可以让window上挂载的keydown事件监听不生效了
          document.body.addEventListener(event, stopPropagationKeyEvent)
          document.body.addEventListener(event, stopPropagationKeyEvent, {
            capture: true,
          })

          if (!containerRef.current) return
          // TODO 这里如果有嵌套shadowDom，就失效。但目前AppRoot只有一层shadowDom，暂时不考虑修复
          containerRef.current.addEventListener(event, shadowRootKeyEvent)
          containerRef.current.addEventListener(event, shadowRootKeyEvent, {
            capture: true,
          })
        })

        return () => {
          events.forEach((event) => {
            document.body.removeEventListener(event, stopPropagationKeyEvent)
            document.body.removeEventListener(event, stopPropagationKeyEvent, {
              capture: true,
            })

            if (!containerRef.current) return
            containerRef.current.removeEventListener(event, shadowRootKeyEvent)
            containerRef.current.removeEventListener(
              event,
              shadowRootKeyEvent,
              {
                capture: true,
              },
            )
          })
        }
      })

      // iframe里监听从top发来的按键消息，代理转发给本iframe里的window
      useOnce(() => {
        if (!isIframe()) return
        return onPostMessage(PostMessageEvent.fullInWeb_eventProxy, (data) => {
          window.dispatchEvent(
            new CustomEvent(`dm-${data.type}`, {
              detail: {
                ...data,
                stopPropagation: () => {},
                preventDefault: () => {},
              },
              bubbles: true,
            }),
          )
        })
      })

      useOnce(() => {
        if (!containerRef.current) return
        const playerEl = this.miniPlayer.playerRootEl
        if (!playerEl) {
          console.error(
            '不正常的miniPlayer.init()，没有 playerEl',
            this.miniPlayer,
          )
          throw Error('不正常的miniPlayer.init()')
        }
        containerRef.current.appendChild(playerEl)
      })

      return (
        <AppRoot isShadowRoot>
          <div
            className="absolute scale-100"
            style={{
              left: isFixedPos ? rect.left : 0,
              top: isFixedPos ? rect.top : 0,
              width: isFixedPos ? size?.width : '100%',
              height: isFixedPos ? size?.height : '100%',
              zIndex: 9999,
            }}
          >
            <div
              className="relative z-10 w-full h-full"
              ref={containerRef}
            ></div>
          </div>
        </AppRoot>
      )
    }

    const root = createElement('div')
    const reactRoot = createRoot(root)
    reactRoot.render(<VideoPlayerOuterContainer />)

    const replacePlayer = (replacerParent: HTMLElement) => {
      // fixed 模式是替换 videoEl 成 VideoPlayer 组件
      if (isFixedPos) {
        replacerParent.replaceChild(root, videoEl)
        this.close = () => {
          reactRoot.unmount()
          tryCatch(() => {
            replacerParent.replaceChild(videoEl, root)
          })
        }
      }
      // 否则直接替加进 child 就行了
      else {
        replacerParent.appendChild(root)
        this.close = () => {
          reactRoot.unmount()
          tryCatch(() => {
            replacerParent.removeChild(root)
          })
        }
      }
    }

    replacePlayer(replacerParent)
    this.on(PlayerEvent.webVideoChanged, (newVideoEl) => {
      const [topParentWithPosition, , isFixedPos] =
        getVideoElInitFloatButtonData(newVideoEl)

      const replacerParent = isFixedPos
        ? newVideoEl.parentElement
        : topParentWithPosition

      if (!replacerParent) throw Error('不正常的webVideoEl')

      replacePlayer(replacerParent)
    })

    this.on(PlayerEvent.close, this.close)

    // 有出现播放中替换播放器会导致播放器暂停的问题
    setTimeout(() => {
      if (this.webVideo.paused !== paused) {
        if (paused) {
          this.webVideo.pause()
        } else {
          this.webVideo.play()
        }
      }
    }, 50)
  }
}
