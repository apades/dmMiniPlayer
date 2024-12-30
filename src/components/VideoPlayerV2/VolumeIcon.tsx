import { FC, useContext, useState } from 'react'
import vpContext from './context'
import Iconfont from '../Iconfont'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { useKeydown } from './hooks'

const VolumeIcon: FC = (props) => {
  const [isVisible, setVisible] = useState(false)
  const [volume, setVolume] = useState(0)
  const { webVideo } = useContext(vpContext)

  const { run } = useDebounceTimeoutCallback(() => setVisible(false), 800)

  useTargetEventListener(
    'volumechange',
    () => {
      if (!webVideo) return
      setVolume(~~(webVideo.muted ? 0 : webVideo.volume * 100))
      run(() => setVisible(true))
    },
    webVideo,
  )

  useKeydown((key) => {
    switch (key) {
      case 'ArrowUp':
      case 'ArrowDown':
        run(() => setVisible(true))
        break
    }
  })

  return (
    isVisible && (
      <div className="z-10 ab-center pointer-events-none">
        <div className="f-i-center relative gap-2 vp-cover-icon-bg rounded-[8px] px-3 py-1 mb:text-[14px] text-[18px]">
          <Iconfont type="iconicon_player_volume" />
          <span>{volume}%</span>
        </div>
      </div>
    )
  )
}

export default VolumeIcon
