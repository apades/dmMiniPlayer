import DocMiniPlayer from '@root/core/DocMiniPlayer'
import MiniPlayer from '@root/core/miniPlayer'
import { useOnce } from '@root/hook'
import { openSettingPanel } from '@root/store/config'
import '@apad/setting-panel/lib/index.css'
import { dq, dq1, wait } from '@root/utils'
import { useState, type FC, useRef } from 'react'
import AsyncLock from '@root/utils/AsyncLock'
import { injectFunction } from '@root/utils/injectFunction'
import { dqParents } from '@root/utils/dom'
import { observeVideoEl } from '@root/utils/observeVideoEl'

const trustLock = new AsyncLock()
window.addEventListener('click', () => trustLock.ok())

const root = dq1('#app')

async function docPIP() {
  await trustLock.waiting()
  let pipWindow = await window.documentPictureInPicture.requestWindow()
  window.pipwindow = pipWindow

  let styles = document.head.querySelectorAll('style')
  //   const root = createElement('div')
  pipWindow.document.body.appendChild(root)
  // styles.forEach((style) => {
  //   pipWindow.document.head.appendChild(style)
  // })
}

const v1 = () => (
  <div key="v1">
    <video
      src={process.env.videoUrl}
      className="video1"
      muted
      crossOrigin="anonymous"
      controls
      height="200"
    ></video>
  </div>
)
const v2 = () => (
  <div key="v2">
    <div>
      <video
        src={process.env.video2Url}
        className="video2"
        muted
        crossOrigin="anonymous"
        controls
        height="300"
      ></video>
    </div>
  </div>
)

window.dqParents = dqParents

console.log('process.env.video2Url', process.env.video2Url)

const App: FC = (props) => {
  let [player, setPlayer] = useState<DocMiniPlayer>()
  let [isV2, setV2] = useState(true)
  const mainRef = useRef<HTMLDivElement>()
  window.player = player

  useOnce(() => {
    setPlayer(
      new DocMiniPlayer({
        videoEl: dq1('video'),
      })
    )
  })

  useOnce(() => {
    let main = dq1('.main')
    let { originKeysValue, restore } = injectFunction(
      main,
      'removeChild',
      (...args) => {
        console.log('remove', args)
      }
    )

    observeVideoEl(dq1('video'), (videoEl) => {
      console.log('更换了videoEl', videoEl)
      window.player.updateWebVideoPlayerEl(videoEl)
    })
    // let observer = new MutationObserver((list) => {
    //   console.log('list', list)
    // })

    // observer.observe($0, { childList: true })

    return () => {
      restore()
      // observer.disconnect()
    }
  })

  return (
    <div className="main" ref={mainRef}>
      {isV2 ? v2() : v1()}
      {/* {v1()}
      {v2()} */}
      <div>
        <button onClick={() => player.openPlayer()}>open</button>
        <button onClick={() => openSettingPanel()}>setting</button>
        <button
          onClick={async () => {
            await trustLock.waiting()
            let pipWindow =
              await window.documentPictureInPicture.requestWindow()
            pipWindow.document.body.appendChild(dq1('video'))
          }}
        >
          add Video to PIP
        </button>
        <button
          onClick={() =>
            setV2((v) => {
              // wait().then(() => {
              //   player.updateWebVideoPlayerEl(
              //     v ? dq1('.video1') : dq1('.video2')
              //   )
              // })
              return !v
            })
          }
        >
          toggle
        </button>
      </div>
    </div>
  )
}

export default App