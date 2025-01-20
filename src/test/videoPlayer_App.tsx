import VideoPlayer from '@root/components/VideoPlayer'
import VideoPlayerV2 from '@root/components/VideoPlayerV2'
import { useOnce } from '@root/hook'
import { openSettingPanel } from '@root/store/config'
import { dq1 } from '@root/utils'
import { useRef, useState, type FC } from 'react'
import './videoPlayer_App.less'
import { listSelector } from '@root/utils/listSelector'
import parser from '@root/core/SubtitleManager/subtitleParser/srt'
import '@root/core/danmaku/DanmakuEngine/htmlDanmaku/index.less'
import { HtmlDanmakuEngine as DanmakuEngine } from '@root/core/danmaku/DanmakuEngine'
import IronKinokoDanmaku from '@root/core/danmaku/DanmakuEngine/IronKinoko/lib/index'
import { dans } from './data/dans'
import CanvasVideo from '@root/core/CanvasVideo'
import chalk from 'chalk'
import { SideSwitcher } from '@root/core/SideSwitcher'
import { useUpdate } from 'ahooks'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import VideoPlayerBase from '@root/core/VideoPlayer/VideoPlayerBase'

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
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const video2ref = useRef<HTMLVideoElement>(null)

  let [input, setInput] = useState('')
  const [editInput, setEditInput] = useState('edit')
  const danmakuContainerRef = useRef<HTMLDivElement>(null)
  const danmakuSenderRef = useRef<DanmakuSender>()
  const danmakuEngineRef = useRef<DanmakuEngine>()
  const sideSwitcher = useRef<SideSwitcher>()
  const videoPlayerRef = useRef<VideoPlayerBase>()

  const forceUpdate = useUpdate()

  useOnce(async () => {
    // const dm = new IronKinokoDanmaku({
    //   container: danmakuContainerRef.current!,
    //   media: videoRef.current!,
    //   comments: dans.map((d) => {
    //     return {
    //       time: d.time!,
    //       text: d.text,
    //       mode:
    //         (d.type == 'bottom' && 'bottom') ||
    //         (d.type === 'right' && 'rtl') ||
    //         (d.type === 'top' && 'top') ||
    //         'rtl',
    //     }
    //   }),
    // })
    // window.dm = dm

    const dm = new DanmakuEngine()
    window.dm = dm
    dm.init({
      media: videoRef.current!,
      container: danmakuContainerRef.current!,
    })
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
    danmakuEngineRef.current = dm

    // captureStream() 需要用户信任操作才能用
    await new Promise((res) => (window.onclick = res))
    const canvasVideo = new CanvasVideo({ videoEl: videoRef.current! })
    window.canvasVideo = canvasVideo
    // video2ref.current!.srcObject = canvasVideo.canvasVideoStream
    // video2ref.current!.play()
    document.body.appendChild(canvasVideo.canvas)
  })

  useOnce(() => {
    console.log('ref.current')

    sideSwitcher.current = new SideSwitcher()
    const el = document.createElement('div')
    const generateItems = (name: string, length: number) =>
      new Array(length)
        .fill(0)
        .map((_, i) => ({ el, link: '', linkEl: el, title: `${name}${i + 1}` }))
    sideSwitcher.current.init([
      {
        category: 'a',
        items: generateItems('a', 4),
      },
      {
        category: 'b',
        items: [],
      },
      {
        category: 'c',
        items: generateItems('c', 3),
      },
    ])

    danmakuSenderRef.current = new DanmakuSender()
    danmakuSenderRef.current.setData({
      webSendButton: dq1('.btn1') as any,
      webTextInput: dq1('.input1') as any,
    })
    forceUpdate()

    videoPlayerRef.current = new VideoPlayerBase({
      webVideoEl: videoRef.current!,
      // danmakuEngine: danmakuEngineRef.current,
      danmakuSender: danmakuSenderRef.current,
      sideSwitcher: sideSwitcher.current,
    })
  })

  return (
    <div ref={ref}>
      <div className="p-2 bor-[black] mb-4">
        <h2>video 1</h2>
        <video
          src="https://github.com/nickdesaulniers/netfix/raw/gh-pages/demo/frag_bunny.mp4"
          ref={videoRef}
        />

        <button>replace video node</button>
      </div>

      <div
        ref={danmakuContainerRef}
        className="!fixed w-full h-full left-0 top-0 pointer-events-none"
      ></div>
      {/* <div style={{ height: 200 }}>
        <VideoPlayer
          // useWebVideo
          webVideo={videoRef.current}
          sideSwitcher={sideSwitcher.current}
        />
      </div> */}
      <div style={{ height: 500 }} rc-f-init="true">
        {videoRef.current && videoPlayerRef.current && (
          <VideoPlayerV2
            // uri="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
            useWebVideo
            webVideo={videoRef.current}
            sideSwitcher={sideSwitcher.current}
            danmakuSender={danmakuSenderRef.current}
            danmakuEngine={danmakuEngineRef.current}
            videoPlayer={videoPlayerRef.current}
            // renderSideActionArea={<Side />}
          />
        )}
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
          dangerouslySetInnerHTML={{ __html: 'edit' }}
        ></div>
        <button
          className="btn2"
          onClick={() => {
            console.log(editInput)
          }}
        >
          test
        </button>
      </div>
    </div>
  )
}

export default App
