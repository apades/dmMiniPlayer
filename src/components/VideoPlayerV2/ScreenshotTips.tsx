import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import { FC, useContext, useState } from 'react'
import vpContext from './context'
import { useKeydown } from './hooks'
import { tryCatch } from '@root/utils'
import { screenshotVideo, downloadImage } from '@root/utils/screenshot'

const ScreenshotTips: FC = () => {
  const [isVisible, setVisible] = useState(false)
  const { webVideo } = useContext(vpContext)
  const [errorText, setErrorText] = useState('')

  const { run } = useDebounceTimeoutCallback(() => setVisible(false), 1000)

  useKeydown((key, e) => {
    if (key === 'p' && e.shiftKey) {
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
        setErrorText('Not support in this video')
        run(() => setVisible(true))
      }
    }
  })

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
