import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import { tryCatch } from '@root/utils'
import { t } from '@root/utils/i18n'
import { downloadImage, screenshotVideo } from '@root/utils/screenshot'
import { type FC, useContext, useState } from 'react'
import vpContext from './context'

const ScreenshotTips: FC = () => {
  const [isVisible, setVisible] = useState(false)
  const { webVideo, eventBus } = useContext(vpContext)
  const [errorText, setErrorText] = useState('')

  const { run } = useDebounceTimeoutCallback(() => setVisible(false), 1000)

  useOnce(() =>
    eventBus.on2(PlayerEvent.command_screenshot, () => {
      const [err, imagUrl] = tryCatch(() => {
        if (!webVideo) return
        return screenshotVideo(webVideo)
      })
      if (imagUrl) {
        downloadImage(
          imagUrl,
          `${document.title} ${new Date().toLocaleString()}`,
        )
      } else {
        console.error(err)
        setErrorText(t('shortcut.notSupport'))
        run(() => setVisible(true))
      }
    }),
  )

  if (!isVisible) return

  return (
    <div className="z-10 ab-center pointer-events-none">
      <div className="f-i-center relative gap-2 vp-cover-icon-bg rounded-[8px] px-3 py-1 mb:text-[14px] text-[16px]">
        {errorText}
      </div>
    </div>
  )
}

export default ScreenshotTips
