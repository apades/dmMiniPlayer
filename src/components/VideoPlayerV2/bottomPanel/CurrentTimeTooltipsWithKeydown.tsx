import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import { formatTime } from '@root/utils'
import { useUpdate } from 'ahooks'
import classNames from 'classnames'
import { type FC, RefObject, useContext, useState } from 'react'
import vpContext from '../context'

/**在按键seek时显示currentTime */
const CurrentTimeTooltipsWithKeydown: FC<{}> = (props) => {
  const { eventBus } = useContext(vpContext)
  const [isVisible, setVisible] = useState(false)
  const [isFine, setFine] = useState(false)
  const update = useUpdate()

  const { run, clear } = useDebounceTimeoutCallback(
    () => setVisible(false),
    800,
  )

  useOnce(() =>
    eventBus.on2(PlayerEvent.changeCurrentTimeByKeyboard, () => {
      run(() => {
        setVisible(true)
        setFine(false)
        update()
      })
    }),
  )

  useOnce(() =>
    eventBus.on2(PlayerEvent.changeCurrentTimeByKeyboard_fine, () => {
      run(() => {
        setVisible(true)
        setFine(true)
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
      <div className="bg-gradient-to-t from-[#000] opacity-70 h-full w-full absolute z-[1]" />
      {isVisible && <Inner isFine={isFine} />}
    </div>
  )
}

const Inner: FC<{ isFine?: boolean }> = (props) => {
  const { webVideo } = useContext(vpContext)
  if (!webVideo) return null
  return (
    <div className={classNames('pl-[12px] text-white relative z-[2]')}>
      {formatTime(webVideo.currentTime)}
      {props.isFine &&
        `.${webVideo.currentTime.toString().split('.')[1] || '00'}`}{' '}
      / {formatTime(webVideo.duration)}
    </div>
  )
}

export default CurrentTimeTooltipsWithKeydown
