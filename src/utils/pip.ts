import PostMessageEvent from '@root/shared/postMessageEvent'
import { postMessageToTop } from './windowMessages'
import { VIDEO_ID_ATTR } from '@root/shared/config'
import { createElement } from '.'
import { DocPIPRenderType } from '@root/types/config'

export const postStartPIPDataMsg = async (
  renderType: DocPIPRenderType | null,
  videoEl: HTMLVideoElement,
) => {
  const id = videoEl.getAttribute(VIDEO_ID_ATTR)!
  const rect = videoEl.getBoundingClientRect()
  const isRestriction =
    renderType === DocPIPRenderType.capture_displayMediaWithRestrictionTarget

  let restrictionTarget: RestrictionTarget | undefined

  const isolateId = 'isolate-id'
  if (
    isRestriction &&
    videoEl.parentElement &&
    videoEl.parentElement.id !== isolateId
  ) {
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
    restrictionTarget = await RestrictionTarget.fromElement(container)
  }

  postMessageToTop(PostMessageEvent.startPIPFromFloatButton, {
    cropTarget:
      renderType === DocPIPRenderType.capture_displayMediaWithCropTarget
        ? await CropTarget.fromElement(videoEl)
        : undefined,
    restrictionTarget,
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
    renderType,
  })
}
