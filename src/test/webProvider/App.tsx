import '@apad/setting-panel/lib/index.css'
import { WebProvider } from '@root/core/WebProvider'
import { useOnce } from '@root/hook'
import { openSettingPanel } from '@root/store/config'
import { useRef, useState, type FC } from 'react'
import TestWebProvider from './TestWebProvider'
import { PlayerEvent } from '@root/core/event'

const v1 = () => (
  <div key="v1">
    <video
      src={
        'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
      }
      className="video1"
      muted
      controls
      height="200"
    ></video>
  </div>
)
const v2 = () => (
  <div key="v2">
    <div>
      <video
        src={
          'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
        }
        className="video2"
        muted
        controls
        height="300"
      ></video>
    </div>
  </div>
)

const App: FC = (props) => {
  // const [player, setPlayer] = useState<WebProvider>()
  const [isV2, setV2] = useState(true)
  const mainRef = useRef<HTMLDivElement>(null)

  // useOnce(() => {
  //   const webProvider = new TestWebProvider()
  //   window.webProvider = webProvider
  //   setPlayer(webProvider)
  //   webProvider.on(PlayerEvent.close, () => {

  //   })
  // })

  const openPlayer = () => {
    const webProvider = new TestWebProvider()
    window.webProvider = webProvider

    const handleOnClose = webProvider.on2(PlayerEvent.close, () => {
      window.webProvider = null
      handleOnClose()
    })

    webProvider.openPlayer()
  }

  return (
    <div className="main" ref={mainRef}>
      {isV2 ? v2() : v1()}
      <div className="setting">
        <button onClick={() => openPlayer()}>open</button>
        <button onClick={() => openSettingPanel()}>setting</button>
        <button
          onClick={() =>
            setV2((v) => {
              return !v
            })
          }
        >
          toggle video dom
        </button>
      </div>
    </div>
  )
}

export default App
