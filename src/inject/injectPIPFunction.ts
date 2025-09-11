import { ATTR_DISABLE_INJECT_PIP, VIDEO_ID_ATTR } from '@root/shared/config'
import PostMessageEvent from '@root/shared/postMessageEvent'
import { tryCatch, uuid } from '@root/utils'
import { postStartPIPDataMsg } from '@root/utils/pip'
import { onPostMessage } from '@root/utils/windowMessages'

function main() {
  const originReqPIP = HTMLVideoElement.prototype.requestPictureInPicture

  HTMLVideoElement.prototype.requestPictureInPicture = function () {
    const [cannotAccessTop] = tryCatch(() => top!.document)
    if (cannotAccessTop) return originReqPIP.bind(this)()

    if (!this.getAttribute(VIDEO_ID_ATTR)) {
      this.setAttribute(VIDEO_ID_ATTR, uuid())
    }

    // ? 很奇怪在agemys里requestPictureInPicture不能是async function，不然连第一行都没法运行
    return new Promise(async (res) => {
      postStartPIPDataMsg(null, this)
      const [{ isOk }] = await onPostMessage(
        PostMessageEvent.startPIPFromFloatButton_resp,
      )
      if (isOk) return res(window as any as PictureInPictureWindow)
      return res(originReqPIP.bind(this)())
    })
  }
}

if (!document.documentElement.getAttribute(ATTR_DISABLE_INJECT_PIP)) {
  main()
}
