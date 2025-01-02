import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import { FC, RefObject, useContext, useState } from 'react'
import vpContext from '../context'
import classNames from 'classnames'
import { formatTime } from '@root/utils'
import { useUpdate } from 'ahooks'

/**在按键seek时显示currentTime */
const CurrentTimeTooltipsWithKeydown: FC<{}> = (props) => {
  const { eventBus } = useContext(vpContext)
  const [isVisible, setVisible] = useState(false)
  const update = useUpdate()

  const { run, clear } = useDebounceTimeoutCallback(
    () => setVisible(false),
    800,
  )

  useOnce(() =>
    eventBus.on2(PlayerEvent.changeCurrentTimeByKeyboard, () => {
      run(() => {
        setVisible(true)
        update()
      })
    }),
  )

  return (
    <div
      className={classNames(
        isVisible ? 'opacity-100' : 'opacity-0',
        'transition-all pointer-events-none',
        'h-area-height w-full f-i-center',
        'absolute bottom-0 left-0 z-[2]',
      )}
    >
      <div className="bg-gradient-to-t from-[#000] opacity-70 h-full w-full absolute z-[1]"></div>
      {isVisible ? <Inner /> : '00:00'}
    </div>
  )
}

const Inner: FC = (props) => {
  const { webVideo } = useContext(vpContext)
  if (!webVideo) return null
  return (
    <div className={classNames('px-[4px] text-white')}>
      {formatTime(webVideo.currentTime)} / {formatTime(webVideo.duration)}
    </div>
  )
}

export default CurrentTimeTooltipsWithKeydown
