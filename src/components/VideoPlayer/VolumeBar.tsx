import classNames from 'classnames'
import { useRef } from 'react'
import { type FC, useState } from 'react'
import Iconfont from '../Iconfont'
import ProgressBar from '../ProgressBar'

type Props = {
  setVolume: (value: React.SetStateAction<number>) => void
  setMute: (value: React.SetStateAction<boolean>) => void
  volume: number
  videoRef: React.MutableRefObject<HTMLVideoElement>
}
const VolumeBar: FC<Props> = (props) => {
  const { setVolume, volume } = props

  const [isActive, setActive] = useState(false)

  const className = classNames([
    'icon',
    'volume',
    {
      mute: !volume || props.videoRef.current?.muted,
      active: isActive,
    },
  ])

  const timmer = useRef<NodeJS.Timeout>()

  return (
    <div className={className}>
      <div className="volume-progress">
        <ProgressBar
          percent={volume}
          width={8}
          direction="v"
          loadColor="var(--color-main)"
          onClick={(p) => {
            if (props.videoRef.current.muted) {
              props.setMute((m) => {
                props.videoRef.current.muted = !m
                return !m
              })
            }
            setVolume(p)
            setActive(true)
            clearTimeout(timmer.current)
            timmer.current = setTimeout(() => {
              setActive(false)
            }, 1000)
          }}
          bgColor="#D8D8D8"
          style={{
            height: 100,
            margin: 'auto',
            cursor: 'pointer',
            marginTop: 10,
          }}
        />
      </div>
      <div
        onClick={() => {
          props.setMute((m) => {
            props.videoRef.current.muted = !m
            return !m
          })
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
