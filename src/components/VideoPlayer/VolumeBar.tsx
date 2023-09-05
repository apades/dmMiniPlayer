import classNames from 'classnames'
import { useRef } from 'react'
import { type FC, useState } from 'react'
import Iconfont from '../Iconfont'
import ProgressBar from '../ProgressBar'

type Props = {
  setVolume: (value: React.SetStateAction<number>) => void
  volume: number
}
let VolumeBar: FC<Props> = (props) => {
  let { setVolume, volume } = props

  let [beforeMuteVolume, setBeforeMuteVolume] = useState(volume)
  let [isActive, setActive] = useState(false)

  let className = classNames([
    'icon',
    'volume',
    {
      mute: !volume,
      active: isActive,
    },
  ])

  let timmer = useRef<NodeJS.Timeout>()

  return (
    <div className={className}>
      <div className="volume-progress">
        <ProgressBar
          percent={volume}
          width={8}
          direction="v"
          loadColor="var(--color-main)"
          onClick={(p) => {
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
          if (!volume) {
            setVolume(beforeMuteVolume)
          } else {
            setVolume(0)
            setBeforeMuteVolume(volume)
          }
        }}
        className="v-icon"
      >
        <Iconfont className="normal" type="iconicon_player_volume" />
        <Iconfont className="muted" type="iconMute1" />
      </div>
    </div>
  )
}

export default VolumeBar
