import { FC, useContext, useState } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { checkJumpInBufferArea } from '../VideoPlayer/utls'
import vpContext from './context'

const LoadingIcon: FC = (props) => {
  const [isLoading, setLoading] = useState(false)
  const { webVideo, isLive } = useContext(vpContext)

  useTargetEventListener(
    'waiting',
    () => {
      if (!webVideo) return
      const isCanPlay = isLive
        ? false
        : checkJumpInBufferArea(webVideo.buffered, webVideo.currentTime)
      setLoading(!isCanPlay)
    },
    webVideo,
  )
  useTargetEventListener(
    'canplay',
    () => {
      // if (!webVideo) return
      setLoading(false)
    },
    webVideo,
  )

  return (
    isLoading && (
      <div className="vp-loading z-3 ab-center pointer-events-none">
        <div
          className="f-center relative vp-cover-icon-bg rounded-full animate-spin mb:p-2 p-4"
          style={{ animationDuration: '10s' }}
        >
          <LoadingOutlined className="text-[80px] mb:text-[40px] text-main" />
        </div>
      </div>
    )
  )
}

export default LoadingIcon
