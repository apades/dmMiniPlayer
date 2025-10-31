import { ShrinkOutlined } from '@ant-design/icons'
import WebextEvent from '@root/shared/webextEvent'
import { isDocPIP } from '@root/utils'
import { getDocPIPBorderSize } from '@root/utils/docPIP'
import { FC, useContext } from 'react'
import { sendMessage } from 'webext-bridge/content-script'
import { useMemoizedFn } from 'ahooks'
import { useOnce } from '@root/hook'
import { PlayerEvent } from '@root/core/event'
import vpContext from '../context'
import ActionButton from './ActionButton'

const ResizeButton: FC = () => {
  const { videoPlayerRef, webVideo, eventBus } = useContext(vpContext)

  const handleResize = useMemoizedFn(() => {
    if (!webVideo) return
    const pipWindow = window.documentPictureInPicture.window

    const vw = webVideo.videoWidth,
      vh = webVideo.videoHeight

    const [borX, borY] = getDocPIPBorderSize(pipWindow)

    if (webVideo.clientWidth === pipWindow.innerWidth) {
      sendMessage(WebextEvent.resizeDocPIP, {
        docPIPWidth: pipWindow.innerWidth,
        width: ~~(webVideo.clientWidth + borX),
        height: ~~((vh / vw) * (webVideo.clientWidth + borX) + borY),
      })
    } else {
      sendMessage(WebextEvent.resizeDocPIP, {
        docPIPWidth: pipWindow.innerWidth,
        width: ~~((vw / vh) * webVideo.clientHeight + borX),
        height: ~~(webVideo.clientHeight + borY),
      })
    }
  })

  useOnce(() => eventBus.on2(PlayerEvent.command_autoResize, handleResize))

  if (!isDocPIP(videoPlayerRef.current)) return
  return (
    <ActionButton onClick={handleResize}>
      <ShrinkOutlined />
    </ActionButton>
  )
}

export default ResizeButton
