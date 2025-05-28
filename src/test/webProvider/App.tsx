import '@apad/setting-panel/lib/index.css'
import { WebProvider } from '@root/core/WebProvider'
import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import { openSettingPanel } from '@root/store/config'
import { type FC, useRef, useState } from 'react'
import { TEST_VIDEO_1 } from '../data/video'
import TestWebProvider from './TestWebProvider'

const v1 = () => (
  <div key="v1">
    <video src={TEST_VIDEO_1} className="video1" muted controls height="200" />
  </div>
)
const v2 = () => (
  <div key="v2">
    <div>
      <video
        src={TEST_VIDEO_1}
        className="video2"
        muted
        controls
        height="300"
      />
    </div>
  </div>
)

// ? 不知道为什么这不支持canvas stream显示在docPIP里，插件用法就没有问题
const App: FC = (props) => {
  const [isV2, setV2] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

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
