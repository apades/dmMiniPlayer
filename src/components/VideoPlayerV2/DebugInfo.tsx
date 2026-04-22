import configStore from '@root/store/config'
import { useInterval, useUpdate } from 'ahooks'
import { observer } from 'mobx-react'
import { FC } from 'react'

const DebugInfo: FC = observer(() => {
  if (!configStore.showDebugInfo) return null
  return (
    <div className="absolute top-0 left-0 z-1000 pointer-events-none bg-black/40 text-xs text-white p-2">
      <p>debugInfo: </p>
      <p className="text-green-500">
        mode: {window.provider?.config.renderType} <br />
        from: {window.provider?.config.from}
      </p>
      <PosInfo />
    </div>
  )
})

const PosInfo = () => {
  const update = useUpdate()
  useInterval(() => {
    update()
  }, 50)
  const pipWindow = window.documentPictureInPicture.window
  return (
    <p>
      pos: <br />
      w: {pipWindow.innerWidth} h: {pipWindow.innerHeight} <br />
      l: {pipWindow.screenLeft} t: {pipWindow.screenTop} <br />
      mainDPR: {window.top?.devicePixelRatio} pipDPR:{' '}
      {pipWindow.devicePixelRatio}
    </p>
  )
}

export default DebugInfo
