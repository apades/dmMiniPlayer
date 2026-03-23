import { LoadingOutlined } from '@ant-design/icons'
import AppRoot from '@root/components/AppRoot'
import PostMessageEvent from '@root/shared/postMessageEvent'
import playerConfig from '@root/store/playerConfig'
import { createElement } from '@root/utils'
import Events2 from '@root/utils/Events2'
import { onPostMessage, postMessageToChild } from '@root/utils/windowMessages'
import classNames from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { sendMessage } from 'webext-bridge/content-script'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import DocPIPWebProvider from './DocPIPWebProvider'

export default class LaunchPIPWithReplaceModeFromLinkWebProvider extends DocPIPWebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected override MiniPlayer = HtmlVideoPlayer
  iframeEventBus = new Events2<{ fail: string }>()

  override get webVideo() {
    return null as any
  }

  private initLoadingView() {
    if (!this.pipWindow) throw Error('没初始化pipWindow')

    const LoadingView: FC = () => {
      const [isOk, setOk] = useState(false)
      const iframeRef = useRef<HTMLIFrameElement>(null)
      const [failReason, setFailReason] = useState<string>('')

      useEffect(() => {
        console.log('iframeRef.current', iframeRef.current)
        if (!iframeRef.current) return
        iframeRef.current.addEventListener('error', () => {
          this.iframeEventBus.emit('fail', 'iframe加载失败')
          setFailReason('iframe加载失败')
        })

        iframeRef.current.addEventListener('load', () => {
          setTimeout(() => {
            postMessageToChild(
              PostMessageEvent.openReplaceModePlayer,
              undefined,
              iframeRef.current!.contentWindow!,
            )
          }, 500)

          //   new Promise(async()=>{

          //   })
          const unListen = onPostMessage(
            PostMessageEvent.openReplaceModePlayer_resp,
            (data) => {
              unListen()
              if (!data.isOk) {
                this.iframeEventBus.emit('fail', data.reason)
                setFailReason(data.reason)
              } else {
                setOk(true)
              }
            },
          )
        })
      }, [iframeRef.current])

      return (
        <AppRoot>
          <iframe
            src={playerConfig.replaceModeFromLinkUrl}
            ref={iframeRef}
            className="size-full"
          ></iframe>
          <div
            className={classNames(
              'fixed z-9999 size-full top-0 left-0',
              isOk && 'pointer-events-none',
            )}
          >
            <div
              className={classNames(
                'absolute top-0 left-0 size-full bg-black transition-all',
                isOk
                  ? 'opacity-0 backdrop-blur-0'
                  : 'opacity-90 backdrop-blur-sm',
              )}
            ></div>
            {failReason && (
              <div className="ab-center text-white">{failReason}</div>
            )}
            {!isOk && !failReason && (
              <div className="vp-loading ab-center pointer-events-none">
                <div
                  className="f-center relative vp-cover-icon-bg rounded-full animate-spin mb:p-2 p-4"
                  style={{ animationDuration: '10s' }}
                >
                  <LoadingOutlined className="text-[80px] mb:text-[40px] text-main" />
                </div>
              </div>
            )}
          </div>
        </AppRoot>
      )
    }
    const root = createElement('div', { style: { height: '100%' } })
    const reactRoot = createRoot(root)
    reactRoot.render(<LoadingView />)
    this.pipWindow.document.body.appendChild(root)
  }
  override async onInit() {
    await this.initPipWindow()
    await this.initLoadingView()
  }

  // 只需要docPIP的外壳操作代码，播放器的去掉
  override async openPlayer(props?: { videoEl?: HTMLVideoElement }) {
    await this.init()
    sendMessage('PIP-active', { name: 'PIP-active' })
  }
  override async onOpenPlayer() {
    // clear DocPIPWebProvider onOpenPlayer method
  }

  override onUnload() {
    this.iframeEventBus.offAll()
    super.onUnload()
  }
}
