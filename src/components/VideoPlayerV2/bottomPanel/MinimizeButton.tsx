import { MinusOutlined } from '@ant-design/icons'
import WebextEvent from '@root/shared/webextEvent'
import { isDocPIP } from '@root/utils'
import { FC, useContext } from 'react'
import { sendMessage } from 'webext-bridge/content-script'
import { useMemoizedFn } from 'ahooks'
import vpContext from '../context'
import ActionButton from './ActionButton'

/**
 * Minimize the docPIP window to the OS taskbar, pausing the source video.
 *
 * The docPIP window is driven by the background as a real Chrome window, so we
 * ask it to set the window state to `minimized` (see background/docPIP.ts).
 * Only shown in docPIP mode — canvas PIP / replacer mode has no separate window.
 */
const MinimizeButton: FC = () => {
  const { videoPlayerRef, webVideo } = useContext(vpContext)

  const handleMinimize = useMemoizedFn(() => {
    const pipWindow = window.documentPictureInPicture.window
    if (!pipWindow) return
    // pause the source video on minimize
    webVideo?.pause()
    sendMessage(WebextEvent.minimizeDocPIP, {
      docPIPWidth: pipWindow.innerWidth,
    })
  })

  if (!isDocPIP(videoPlayerRef.current)) return
  return (
    <ActionButton onClick={handleMinimize}>
      <MinusOutlined />
    </ActionButton>
  )
}

export default MinimizeButton
