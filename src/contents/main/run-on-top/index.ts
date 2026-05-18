import WebextEvent from '@root/shared/webextEvent'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import PostMessageEvent, {
  RequestPlayerInitFrom,
  RequestPlayerInitFromType,
} from '@root/shared/postMessageEvent'
import configStore from '@root/store/config'
import { autorun } from 'mobx'
import {
  createElement,
  dq1Adv,
  getIframeElFromSource,
  tryCatch,
} from '@root/utils'
import {
  onPostMessage,
  postMessageToChild,
  postMessageToTop,
} from '@root/utils/windowMessages'
import { appendLoggerLinesToChromeStorage } from '@apades/logger/ext'
import { DocPIPRenderType } from '@root/types/config'
import { getMediaStreamInGetter } from '@root/utils/webRTC'
import { PlayerEvent } from '@root/core/event'
import { VIDEO_ID_ATTR } from '@root/shared/config'
import { createPlayer } from '@root/core/create-player'
import { getSimulateVideoEl, requestInitPlayerFromMainCs } from './utils'

export default function runOnTopMain() {
  // start to resolve requestPlayerInit from main cs
  onPostMessage(PostMessageEvent.requestPlayerInit, async (data, source) => {
    // Refuse requestPlayerInit from api.requestPictureInPicture if injectPIPFn is disabled
    if (
      data.from === RequestPlayerInitFrom['api.requestPictureInPicture'] &&
      !configStore.injectPIPFn
    ) {
      postMessageToTop(PostMessageEvent.requestPlayerInit_resp, {
        isOk: false,
      })

      return
    }

    const fn = () => {
      const id = data.videoState.id

      const isWebRTCMode =
        data.renderType === DocPIPRenderType.capture_captureStreamWithWebRTC

      switch (data.renderType) {
        case DocPIPRenderType.capture_captureStreamWithWebRTC:
        case DocPIPRenderType.capture_displayMediaWithCropTarget:
        case DocPIPRenderType.capture_displayMediaWithRestrictionTarget: {
          // 判断captureSource是iframe里还是top发起的
          const isIframe = source !== window

          if (isIframe) {
            const targetIframeEl = getIframeElFromSource(source)
            if (!targetIframeEl) {
              console.error('captureSource', source)
              throw Error('cannot find captureSource iframe')
            }
            const targetIframeRect = targetIframeEl.getBoundingClientRect()
            data.posData.x += targetIframeRect.x
            data.posData.y += targetIframeRect.y
          }

          // Those PIP mode have no real videoEl in top window
          // so we need to simulate a fake videoEl to trigger the provider event system with videoEl
          // and send fake videoEl state to iframe's real videoEl, make there state sync
          const { videoEl, unMount } = getSimulateVideoEl(
            data.videoState,
            source,
          )

          // webRTC mode has some special logic
          if (isWebRTCMode) {
            const { mediaStream, unMount: unMountMediaStream } =
              getMediaStreamInGetter({ target: source })

            const provider = createPlayer({
              ...data,
              videoEl,
              mediaStream,
            })
            window.provider = provider
            provider.on(PlayerEvent.close, () => {
              unMountMediaStream()
              unMount()
              postMessageToChild(
                PostMessageEvent.webRTC_close,
                undefined,
                source,
              )
            })
          } else {
            const provider = createPlayer({
              ...data,
              videoEl,
            })
            window.provider = provider
            provider?.on(PlayerEvent.close, () => {
              unMount()
            })
          }
          return
        }
        default: {
          const videoEl = dq1Adv<HTMLVideoElement>(
            `video[${VIDEO_ID_ATTR}="${id}"]`,
          )
          if (!videoEl) throw Error('videoEl not found')
          const provider = createPlayer({
            ...data,
            videoEl,
          })
          window.provider = provider
          return provider
        }
      }
    }

    const [err] = await tryCatch(fn)
    postMessageToTop(PostMessageEvent.requestPlayerInit_resp, {
      isOk: !err,
      errMsg:
        ((err as any)?.toString && (err as any).toString()) ||
        err?.message ||
        err,
    })
  })

  // MARK: requestInitPlayer
  // Resolve request from extension popup
  onBgMessage(WebextEvent.requestInitPlayerFromExtPopup, () =>
    requestInitPlayerFromMainCs({ from: RequestPlayerInitFrom.extensionPopup }),
  )
  // Resolve request from mediaSession action enterpictureinpicture
  try {
    let isAutoPIP = false
    autorun(() => {
      isAutoPIP = configStore.autoPIP_inPageHide
    })
    navigator.mediaSession.setActionHandler('enterpictureinpicture', (e) => {
      const action = e.enterPictureInPictureReason
      switch (action) {
        case 'useraction': {
          return requestInitPlayerFromMainCs({
            from: RequestPlayerInitFrom[
              'api.mediaSession.enterpictureinpicture.useraction'
            ],
          })
        }
        case 'contentoccluded': {
          if (!isAutoPIP) return
          return requestInitPlayerFromMainCs({
            from: RequestPlayerInitFrom[
              'api.mediaSession.enterpictureinpicture.contentoccluded'
            ],
          })
        }
      }
    })
  } catch (error) {
    console.log(
      '🟡 No support mediaSession action enterpictureinpicture',
      error,
    )
  }

  // MARK: openSetting
  // from tab extension icon contextmenu
  onBgMessage(WebextEvent.openSetting, () => {
    window.openSettingPanel()
  })
  onPostMessage(PostMessageEvent.openSettingPanel, () => {
    window.openSettingPanel()
  })

  // MARK: fullInWeb
  // request full in web from iframe
  onPostMessage(PostMessageEvent.fullInWeb_request, (_, source) => {
    const iframe = getIframeElFromSource(source)
    if (!iframe) {
      console.error('fullInWeb_request cannot find iframe element')
      return
    }

    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const originStyle = iframe.getAttribute('style') || ''
    iframe.setAttribute(
      'style',
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;',
    )

    // 转发top的按键输入事件到tar iframe里
    const stopPropagationKeyEventAndSendProxyEventToIframe = (e: any) => {
      e.stopPropagation()
      postMessageToChild(
        PostMessageEvent.fullInWeb_eventProxy,
        {
          code: e.code,
          target: {
            contentEditable: e.target.contentEditable,
            tagName: e.target.tagName,
          },
          type: e.type,
        },
        source,
      )
    }
    const events: (keyof WindowEventMap)[] = ['keydown', 'keyup', 'keypress']
    events.forEach((event) => {
      // 发现只需要在body上阻止冒泡就可以让window上挂载的keydown事件监听不生效了
      document.body.addEventListener(
        event,
        stopPropagationKeyEventAndSendProxyEventToIframe,
      )
    })

    const unListen = onPostMessage(PostMessageEvent.fullInWeb_close, () => {
      unListen()
      document.body.style.overflow = bodyOverflow
      events.forEach((event) => {
        document.body.removeEventListener(
          event,
          stopPropagationKeyEventAndSendProxyEventToIframe,
        )
      })
      iframe.setAttribute('style', originStyle)
    })
  })

  // MARK: logger (inject world → storage under inject_* key)
  onPostMessage(PostMessageEvent.loggerPersist, (data) => {
    appendLoggerLinesToChromeStorage('inject', data.lines)
  })

  // MARK: misc
  onPostMessage(PostMessageEvent.closePlayer, () => {
    const provider = window.provider
    if (!provider) return
    provider.doNotUsePauseInCloseConfig = true
    provider.close()
  })
  onBgMessage(WebextEvent.reloadPage, () => {
    location.reload()
  })

  onPostMessage(PostMessageEvent.getRenderType, (data, source) => {
    const { fromType } = data
    let renderType = configStore.docPIP_renderType
    if (renderType === DocPIPRenderType.auto) {
      switch (fromType) {
        case RequestPlayerInitFromType['iframe-cannot-access-top']:
          renderType = configStore.notSameOriginIframeCaptureModePriority
          break
        case RequestPlayerInitFromType['iframe-can-access-top']:
          renderType = configStore.sameOriginIframeCaptureModePriority
          break
        case RequestPlayerInitFromType.top:
          renderType = DocPIPRenderType.replaceVideoEl
          break
      }
    }
    postMessageToChild(
      PostMessageEvent.getRenderType_resp,
      { renderType },
      source,
    )
  })

  // MARK: check user active
  /**
   * this is system limitations, user must click the page to make it active and PIP can be opened
   */
  onPostMessage(
    PostMessageEvent.checkUserActivationActive,
    async (data, source) => {
      if (navigator.userActivation.isActive) {
        postMessageToChild(
          PostMessageEvent.checkUserActivationActive_resp,
          {
            isActive: true,
          },
          source,
        )
      } else {
        await new Promise<void>((res) => {
          const coverEl = createElement('div')
          ;(coverEl as any).style =
            'width:100%;height:100%;position:fixed;top:0;left:0;z-index:9999999;'
          document.body.appendChild(coverEl)
          coverEl.addEventListener('click', (e) => {
            if (!e.isTrusted) return
            if (!navigator.userActivation.isActive) return
            document.body.removeChild(coverEl)
            res()
          })
        })

        postMessageToChild(
          PostMessageEvent.checkUserActivationActive_resp,
          {
            isActive: true,
          },
          source,
        )
      }
    },
  )
}
