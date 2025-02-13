import { VIDEO_ID_ATTR } from '@root/shared/config'
import { tryCatch, uuid } from '@root/utils'
import { postStartPIPDataMsg } from '@root/utils/pip'

const originReqPIP = HTMLVideoElement.prototype.requestPictureInPicture

HTMLVideoElement.prototype.requestPictureInPicture = async function () {
  const [cannotAccessTop] = tryCatch(() => top!.document)
  if (cannotAccessTop) return originReqPIP.bind(this)()

  if (!this.getAttribute(VIDEO_ID_ATTR)) {
    this.setAttribute(VIDEO_ID_ATTR, uuid())
  }
  postStartPIPDataMsg(null, this)
  return window as any as PictureInPictureWindow
}
