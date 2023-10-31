import VideoPlayer from '@root/components/VideoPlayer'
import BarrageSender from '@root/core/danmaku/BarrageSender'
import { useOnce } from '@root/hook'
import configStore, { openSettingPanel } from '@root/store/config'
import { dq1 } from '@root/utils'
import { Input } from 'antd'
import { useRef, useState, type FC } from 'react'
import './videoPlayer_App.less'
import { listSelector } from '@root/utils/listSelector'
import { runInAction } from 'mobx'
import vpConfig from '@root/store/vpConfig'

window.listSelector = listSelector
const Side: FC = () => {
  return (
    <div className="side-outer-container">
      {/* TODO 侧边栏提示 */}
      <div className="side-inner-container">
        <ul className="select-list">
          {new Array(10).fill(0).map((_, i) => {
            return (
              <li className="select" key={i}>
                第{i + 1}集
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

const App = () => {
  const ref = useRef<HTMLDivElement>()
  const videoRef = useRef<HTMLVideoElement>(dq1('.video'))
  let [input, setInput] = useState('')

  useOnce(() => {
    const sender = new BarrageSender({
      textInput: dq1('.input-o'),
      webSendButton: dq1('.btn1'),
      webTextInput: dq1('.input1'),
    })
    runInAction(() => {
      vpConfig.canSendBarrage = true
      vpConfig.showBarrage = true
      configStore.vpActionAreaLock = true
    })

    window.sender = sender
    console.log('ref.current')
  })

  return (
    <div ref={ref}>
      <div style={{ height: 200 }}>
        <VideoPlayer
          index={1}
          // uri="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
          webVideo={videoRef.current}
          renderSideActionArea={<Side />}
        />
      </div>
      <button onClick={() => openSettingPanel()}>open setting</button>
      <input className="input-o" />
      <Input
        className="input1"
        onChange={(e) => {
          console.log('change')
          let val = e.target.value
          if (val.length > 3) val = val.slice(0, 3)
          setInput(val)
        }}
        value={input}
        maxLength={3}
        // onInput={(e) => setInput(e.target.value)}
      />
      <button
        className="btn1"
        onClick={() => {
          console.log(input)
        }}
      >
        test
      </button>

      <div>
        <ul className="select-list">
          {new Array(10).fill(0).map((_, i) => {
            return (
              <li
                className="select"
                key={i}
                onClick={() => {
                  console.log('adf')
                }}
              >
                第{i + 1}集
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default App
