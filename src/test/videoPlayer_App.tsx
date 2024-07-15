import VideoPlayer from '@root/components/VideoPlayer'
import BarrageSender from '@root/core/danmaku/BarrageSender'
import { useOnce } from '@root/hook'
import configStore, { openSettingPanel } from '@root/store/config'
import { dq1 } from '@root/utils'
import { CSSProperties, useRef, useState, type FC } from 'react'
import './videoPlayer_App.less'
import { listSelector } from '@root/utils/listSelector'
import { runInAction } from 'mobx'
import vpConfig from '@root/store/vpConfig'
import parser from '@root/core/SubtitleManager/subtitleParser/srt'
import '@root/core/danmaku/DanmakuEngine/htmlDanmaku/index.less'
import { HtmlDanmakuEngine as DanmakuEngine } from '@root/core/danmaku/DanmakuEngine'
import { dans } from './data/dans'
import CanvasVideo from '@root/core/CanvasVideo'
import chalk from 'chalk'

window.parser = parser
window.listSelector = listSelector
const Side: FC = () => {
  return (
    <div className="side-outer-container">
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
  const [editInput, setEditInput] = useState('edit')
  const danmakuContainerRef = useRef<HTMLDivElement>()
  const video2ref = useRef<HTMLVideoElement>(null)

  useOnce(async () => {
    console.log('dm')
    const dm = new DanmakuEngine()
    window.dm = dm
    dm.init({ media: videoRef.current, container: danmakuContainerRef.current })
    dm.addDanmakus(dans)

    dm.on('danmaku-leave', (danmaku) => {
      console.log(chalk.red('danmaku-leave'), danmaku)
    })
    dm.on('danmaku-enter', (danmaku) => {
      console.log(chalk.green('danmaku-enter'), danmaku)
    })
    dm.on('danmaku-leaveTunnel', (danmaku) => {
      console.log(chalk.yellow('danmaku-leaveTunnel'), danmaku)
    })

    // captureStream() 需要用户信任操作才能用
    await new Promise((res) => (window.onclick = res))
    const canvasVideo = new CanvasVideo({ videoEl: videoRef.current })
    window.canvasVideo = canvasVideo
    video2ref.current.srcObject = canvasVideo.canvasVideoStream
    video2ref.current.play()
    document.body.appendChild(canvasVideo.canvas)
  })

  useOnce(() => {
    const sender = new BarrageSender({
      textInput: dq1('.input-o'),
      webSendButton: dq1('.btn1'),
      webTextInput: dq1('.input1'),
    })

    const sender2 = new BarrageSender({
      textInput: dq1('.input-o2'),
      webSendButton: dq1('.btn2'),
      webTextInput: dq1('.input2'),
    })

    runInAction(() => {
      vpConfig.canSendDanmaku = true
      vpConfig.showDanmaku = true
      configStore.vpActionAreaLock = true
    })

    window.sender = sender
    window.sender2 = sender2
    console.log('ref.current')
  })

  return (
    <div ref={ref}>
      <video ref={video2ref} />
      <div
        ref={danmakuContainerRef}
        className="!fixed w-full h-full left-0 top-0 pointer-events-none"
      ></div>
      <div style={{ height: 200 }}>
        <VideoPlayer
          index={1}
          // uri="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
          webVideo={videoRef.current}
          renderSideActionArea={<Side />}
        />
      </div>
      <button onClick={() => openSettingPanel()}>open setting</button>
      <div>
        <p>input 测试</p>
        <input className="input-o" />
        <input
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
      </div>
      <div>
        <p>contentEditable 测试</p>
        <input className="input-o2" />
        <div
          contentEditable
          className="input2"
          onInput={(e) => {
            let val = (e.target as HTMLDivElement).textContent || ''
            console.log('change', val)
            // if (val.length > 3) val = val.slice(0, 3)
            setEditInput(val)
          }}
        >
          edit
        </div>
        <button
          className="btn2"
          onClick={() => {
            console.log(editInput)
          }}
        >
          test
        </button>
      </div>

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
