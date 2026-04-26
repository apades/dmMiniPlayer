import { requestInitPlayer } from '@root/core/requestPlayerInit'
import { ATTR_DISABLE_INJECT_PIP, VIDEO_ID_ATTR } from '@root/shared/config'
import PostMessageEvent, {
  RequestPlayerInitFrom,
} from '@root/shared/postMessageEvent'
import { getPrototypeGetter, tryCatch, uuid } from '@root/utils'
import { onPostMessage, postMessageToTop } from '@root/utils/windowMessages'

let hasInit = false
function main() {
  if (hasInit) return
  hasInit = true
  const originReqPIP = HTMLVideoElement.prototype.requestPictureInPicture

  let val: HTMLVideoElement | null
  HTMLVideoElement.prototype.requestPictureInPicture = function () {
    const [cannotAccessTop] = tryCatch(() => top!.document)
    if (cannotAccessTop) return originReqPIP.bind(this)()

    if (!this.getAttribute(VIDEO_ID_ATTR)) {
      this.setAttribute(VIDEO_ID_ATTR, uuid())
    }

    // ? 很奇怪在agemys里requestPictureInPicture不能是async function，不然连第一行都没法运行
    return new Promise(async (res) => {
      requestInitPlayer({
        videoEl: this,
        from: RequestPlayerInitFrom['api.requestPictureInPicture'],
      })
      const [{ isOk }] = await onPostMessage(
        PostMessageEvent.requestPlayerInit_resp,
      )
      if (isOk) {
        let isClosed = false
        val = this
        tryCatch(() => {
          Object.defineProperty(document, 'pictureInPictureElement', {
            get: () => val,
          })
        })
        const originClose = document.exitPictureInPicture
        document.exitPictureInPicture = async () => {
          if (isClosed) return
          isClosed = true
          postMessageToTop(PostMessageEvent.closePlayer, {
            type: 'api.exitPictureInPicture',
          })
          val = null
          document.exitPictureInPicture = originClose
        }

        const handleCloseEvent = () => {
          this.removeEventListener('leavepictureinpicture', handleCloseEvent)
          if (isClosed) return
          isClosed = true
          postMessageToTop(PostMessageEvent.closePlayer, {
            type: 'event.leavepictureinpicture',
          })
          val = null
          document.exitPictureInPicture = originClose
        }
        this.addEventListener('leavepictureinpicture', handleCloseEvent)

        return res(window as any as PictureInPictureWindow)
      }
      return res(originReqPIP.bind(this)())
    })
  }
}

if (!document.documentElement.getAttribute(ATTR_DISABLE_INJECT_PIP)) {
  main()
} else {
  const observer = new MutationObserver((mutations) => {
    if (document.documentElement.getAttribute(ATTR_DISABLE_INJECT_PIP)) return
    main()
    observer.disconnect()
  })
  observer.observe(document.documentElement, {
    attributes: true,
  })
}
