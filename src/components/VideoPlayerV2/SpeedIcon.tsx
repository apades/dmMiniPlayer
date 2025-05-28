import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import configStore from '@root/store/config'
import { t } from '@root/utils/i18n'
import { type FC, useContext, useState } from 'react'
import vpContext from './context'

const SpeedIcon: FC = (props) => {
  const { eventBus } = useContext(vpContext)
  const [isVisible, setVisible] = useState(false)

  useOnce(() => {
    const unListen = eventBus.on2(PlayerEvent.longTabPlaybackRate, () => {
      setVisible(true)
    })
    const unListen2 = eventBus.on2(PlayerEvent.longTabPlaybackRateEnd, () => {
      setVisible(false)
    })

    return () => {
      unListen()
      unListen2()
    }
  })

  return (
    isVisible && (
      <div className="z-10 absolute left-4 top-4 pointer-events-none">
        <div className="f-i-center relative vp-cover-icon-bg rounded-1 px-3 py-1">
          {configStore.playbackRate}
          {'x '}
          {t('vp.speed')}
        </div>
      </div>
    )
  )
}

export default SpeedIcon
