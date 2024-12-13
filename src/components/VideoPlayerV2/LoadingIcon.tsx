import { FC, useContext, useState } from 'react'
import vpContext from './context'
import { LoadingOutlined } from '@ant-design/icons'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { checkJumpInBufferArea } from '../VideoPlayer/utls'

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
          className="f-center relative vp-cover-icon-bg rounded-full animate-spin p-2"
          style={{ animationDuration: '3s' }}
        >
          <LoadingOutlined className="text-[120px] mb:text-[40px] text-main" />
        </div>
      </div>
    )
  )
}

export default LoadingIcon
