import { useEffect } from 'react'
import MiniPlayer from '@root/miniPlayer'
import AssParser from '@root/utils/AssParser'
import ass from './testass'
window.AssParser = AssParser

// 测试视频 https://www.bilibili.com/video/BV1yL411f7hA/?spm_id_from=333.851.b_7265636f6d6d656e64.5&vd_source=8e6ad3d5f5612b1d591931b1eff4dea7
const App = () => {
  useEffect(() => {
    let dataBarrage = [
      {
        value: 'speed设为0为非滚动',
        time: 1, // 单位秒
        speed: 0,
      },
      {
        value: 'time控制弹幕时间，单位秒',
        color: 'blue',
        time: 2,
      },
    ]

    var eleCanvas = document.getElementById('canvasBarrage')
    var eleVideo = document.getElementById('videoBarrage') as HTMLVideoElement
    let assParser = new AssParser(ass)

    let vp = new MiniPlayer({
      videoEl: eleVideo,
      danmu: {
        dans:
          assParser.dans /* [
          {
            text: '这是弹幕A----------------',
            time: 1,
            color: 'white',
            type: 'right',
          },
          {
            text: '这是弹幕B',
            time: 1.2,
            color: 'blue',
            type: 'right',
          },
          {
            text: '这是弹幕C',
            time: 1.4,
            color: '#6cf',
            type: 'right',
          },
          {
            text: '这是弹幕D',
            time: 2.5,
            color: '#777',
            type: 'right',
          },
          // {
          //   text: 'time控制弹幕时间，单位秒',
          //   color: 'blue',
          //   time: 2,
          //   type: 'right',
          // },
        ] */,
      },
    })
    window.vp = vp

    document.body.appendChild(vp.canvas)
    vp.startRenderAsCanvas()

    // vp.startCanvasPIPPlay()

    // vp.playerVideoEl.width = 400
    // vp.playerVideoEl.height = 240
    // document.body.appendChild(vp.playerVideoEl)

    // var demoBarrage = new CanvasBarrage(eleCanvas, eleVideo, {
    //   data: dataBarrage,
    // })
  }, [])
  return (
    <div>
      <canvas id="canvasBarrage"></canvas>
      <video
        id="videoBarrage"
        width="640"
        height="384"
        src="/assets/temp.mp4"
        controls
      ></video>
    </div>
  )
}

export default App
