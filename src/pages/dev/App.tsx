import { useEffect } from 'react'
import CanvasBarrage from '@root/danmaku/canvas'
import MiniPlayer from '@root/miniPlayer'

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

    let vp = new MiniPlayer({ videoEl: eleVideo })
    window.vp = vp

    document.body.appendChild(vp.canvas)
    vp.startRenderAsCanvas()

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
        src="/assets/video.mp4"
        controls
      ></video>
    </div>
  )
}

export default App
