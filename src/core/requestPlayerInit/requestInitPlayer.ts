import { VIDEO_ID_ATTR } from '@root/shared/config'
import PostMessageEvent, {
  PostMessageProtocolMap,
  RequestPlayerInitFrom,
  RequestPlayerInitFromType,
} from '@root/shared/postMessageEvent'
import { DocPIPRenderType } from '@root/types/config'
import { createElement, isIframe, tryCatch } from '@root/utils'
import { sendMediaStreamInSender } from '@root/utils/webRTC'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'
import getWebProvider from '@root/web-provider/getWebProvider'
import configStore from '@root/store/config'

type Props = (
  | {
      /**
       * is special mode, not PIP type
       * TODO: this is historical legacy code, should be removed in the future
       *  */
      renderType: DocPIPRenderType.replaceWebVideoDom
      videoEl: HTMLVideoElement
      topContainerEl: HTMLElement
      isFixedPos: boolean
    }
  | {
      renderType?: Exclude<
        DocPIPRenderType,
        DocPIPRenderType.replaceWebVideoDom
      >
    }
) & {
  from: RequestPlayerInitFrom
  videoEl: HTMLVideoElement
}

// It's easy failed mode, so try all the list
const notSameOriginModePriorityList = [
  DocPIPRenderType.capture_captureStreamWithWebRTC,
  DocPIPRenderType.capture_displayMediaWithCropTarget,
]

/**
 * this is system limitations, user must click the page to make it active and PIP can be opened
 */
const waitingUserClickToMakingPageActive = async () => {
  if (navigator.userActivation.isActive) return
  return new Promise<void>((res) => {
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
}

type RequestPlayerInitProps =
  PostMessageProtocolMap[PostMessageEvent.requestPlayerInit]

// It maybe called in **iframe or top** window
export async function requestInitPlayer(props: Props) {
  let videoEl = props.videoEl

  console.log('window.isCsEnv', window.isCsEnv)

  const rect = videoEl.getBoundingClientRect()
  const id = videoEl.getAttribute(VIDEO_ID_ATTR)!
  if (!window.isCsEnv) {
    return
  }

  // const configStore = (await import('@root/store/config')).default

  let renderType = props.renderType

  const baseData: Omit<RequestPlayerInitProps, 'renderType'> = {
    posData: {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
      vw: videoEl.videoWidth,
      vh: videoEl.videoHeight,
    },
    videoState: {
      id,
      duration: videoEl.duration,
      currentTime: videoEl.currentTime,
      isPause: videoEl.paused,
    },
    from: props.from,
  }

  // Not PIP type
  // if (props.renderType === DocPIPRenderType.replaceWebVideoDom) {
  // throw new Error('replaceWebVideoDom is not supported in cs env')
  // const getWebProvider = (await import('@root/web-provider/getWebProvider'))
  //   .default
  // const provider = getWebProvider({ renderType: props.renderType })
  // window.provider = provider

  // return provider.initPlayer({
  //   videoEl,
  //   renderType,
  //   ...baseData,
  // })
  // }

  if (!renderType) {
    let fromType = RequestPlayerInitFromType.top
    if (isIframe()) {
      // detected can access top
      const [cannotAccessTop] = tryCatch(() => top!.document)
      if (cannotAccessTop) {
        fromType = RequestPlayerInitFromType['iframe-cannot-access-top']
      } else {
        fromType = RequestPlayerInitFromType['iframe-can-access-top']
      }
    } else {
      fromType = RequestPlayerInitFromType.top
    }

    postMessageToTop(PostMessageEvent.getRenderType, { fromType })
    const [{ renderType: respRenderType }] = await onPostMessage(
      PostMessageEvent.getRenderType_resp,
    )
    renderType = respRenderType
  }

  // If is WebRTC mode, check if can captureStream from videoEl
  // TODO Loop try

  // let isWebRTCMode =
  //   renderType === DocPIPRenderType.capture_captureStreamWithWebRTC
  // let [canNotUseWebRTCMode, stream] = tryCatch(() => {
  //   if (isWebRTCMode) return videoEl.captureStream()
  //   return null
  // })
  // const getVideoElCaptureStream = () => stream!
  // if (canNotUseWebRTCMode && isNotSameOriginMode) {
  // }

  await waitingUserClickToMakingPageActive()

  // TODO Loop try
  const [isError] = await tryCatch(async () => {
    switch (renderType) {
      case DocPIPRenderType.capture_displayMediaWithCropTarget: {
        baseData.cropTarget = await CropTarget.fromElement(videoEl)
        break
      }

      case DocPIPRenderType.capture_displayMediaWithRestrictionTarget: {
        const isolateId = 'isolate-id'
        if (videoEl.parentElement && videoEl.parentElement.id !== isolateId) {
          // restrictionTarget限制是isolation: isolate的元素
          const container = createElement('div', {
            style: {
              position: 'relative',
              width: '100%',
              height: '100%',
              isolation: 'isolate',
            },
            id: isolateId,
          })
          videoEl.parentElement.appendChild(container)
          container.appendChild(videoEl)
          baseData.restrictionTarget =
            await RestrictionTarget.fromElement(container)
        } else if (videoEl.parentElement?.id === isolateId) {
          baseData.restrictionTarget = await RestrictionTarget.fromElement(
            videoEl.parentElement,
          )
        } else throw new Error('restrictionTarget not found')
        break
      }

      case DocPIPRenderType.capture_captureStreamWithWebRTC: {
        const stream = videoEl.captureStream()
        const { unMount } = sendMediaStreamInSender({ stream })

        const handleUnmount = () => {
          unMount()
          unListenWebRTCClose()
        }

        const unListenWebRTCClose = onPostMessage(
          PostMessageEvent.webRTC_close,
          handleUnmount,
        )
        break
      }
    }

    return postMessageToTop(PostMessageEvent.requestPlayerInit, {
      ...baseData,
      renderType,
    })
  })
}
