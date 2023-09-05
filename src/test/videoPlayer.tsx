import VideoPlayer from '@root/components/VideoPlayer'
import { dq1 } from '@root/utils'
import react from 'react-dom/client'
import '@root/style/global.css'
import { openSettingPanel } from '@root/store/config'
import '@apad/setting-panel/lib/index.css'
import '@root/components/VideoPlayer/index.less'
import { useOnce } from '@root/hook'
import { useRef, useState } from 'react'
import BarrageSender from '@root/core/danmaku/BarrageSender'
import { Input } from 'antd'

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

    window.sender = sender
    console.log('ref.current')
  })

  return (
    <div ref={ref}>
      <div style={{ height: 200 }}>
        <VideoPlayer
          index={1}
          mobxOption={{ canSendBarrage: true }}
          // uri="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
          webVideo={videoRef.current}
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
    </div>
  )
}

react.createRoot(dq1('#app')).render(<App />)
