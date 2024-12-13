import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import classNames from 'classnames'
import { type FC, useContext, useEffect, useState } from 'react'
import Iconfont from '../Iconfont'
import ProgressBar from '../ProgressBar'
import vpContext from './context'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import style from './VolumeBar.less?inline'

type Props = {}
const VolumeBar: FC<Props> = (props) => {
  const { webVideo } = useContext(vpContext)
  const [volume, setVolume] = useState(0)
  const [isMuted, setMuted] = useState(false)
  const [isActive, setActive] = useState(false)

  useEffect(() => {
    if (!webVideo) return
    setVolume(webVideo.volume * 100)
    setMuted(webVideo.muted)
  }, [webVideo])

  useTargetEventListener(
    'volumechange',
    () => {
      if (!webVideo) return
      setVolume(webVideo.volume * 100)
      setMuted(webVideo.muted)
    },
    webVideo,
  )

  const className = classNames([
    'icon',
    'volume',
    {
      mute: !volume || isMuted,
      active: isActive,
    },
  ])

  const { run } = useDebounceTimeoutCallback(() => {
    setActive(false)
  })

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{ __html: style }}></style>
      <div className="volume-progress">
        <ProgressBar
          percent={volume}
          width={8}
          direction="v"
          loadColor="var(--color-main)"
          onClick={(p) => {
            if (!webVideo) return

            if (webVideo.muted) {
              webVideo.muted = false
            }

            webVideo.volume = p / 100

            run(() => setActive(true))
          }}
          bgColor="#D8D8D8"
          style={{
            height: 100,
            margin: 'auto',
            cursor: 'pointer',
            marginTop: 14,
          }}
        />
      </div>
      <div
        onClick={() => {
          if (!webVideo) return
          webVideo.muted = !webVideo.muted
        }}
        className="v-icon"
      >
        <Iconfont size={14} className="normal" type="iconicon_player_volume" />
        <Iconfont size={14} className="muted" type="iconMute1" />
      </div>
    </div>
  )
}

export default VolumeBar
