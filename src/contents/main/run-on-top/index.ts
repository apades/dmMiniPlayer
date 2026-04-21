import WebextEvent from '@root/shared/webextEvent'
import { onMessage as onBgMessage } from 'webext-bridge/content-script'
import PostMessageEvent, {
  RequestPlayerInitFrom,
  RequestPlayerInitFromType,
} from '@root/shared/postMessageEvent'
import configStore from '@root/store/config'
import { autorun } from 'mobx'
import { dq1Adv, getIframeElFromSource, tryCatch } from '@root/utils'
import {
  onPostMessage,
  postMessageToChild,
  postMessageToTop,
} from '@root/utils/windowMessages'
import { DocPIPRenderType } from '@root/types/config'
import { getMediaStreamInGetter } from '@root/utils/webRTC'
import getWebProvider from '@root/web-provider/getWebProvider'
import { PlayerEvent } from '@root/core/event'
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

      const provider = getWebProvider({ renderType: data.renderType })
      window.provider = provider

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

            provider.initPlayer({
              ...data,
              videoEl,
              mediaStream,
            })
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
            provider.initPlayer({
              ...data,
              videoEl,
            })
            provider?.on(PlayerEvent.close, () => {
              unMount()
            })
          }
          return
        }
        default: {
          const videoEl = dq1Adv<HTMLVideoElement>(`video[data-dm-vid="${id}"]`)
          if (!videoEl) throw Error('videoEl not found')
          return provider.initPlayer({
            ...data,
            videoEl,
          })
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

  // MARK: misc
  onPostMessage(PostMessageEvent.closeDocPIP, () => {
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
}
