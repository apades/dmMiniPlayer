import '@apad/setting-panel/lib/index.css'
import DocMiniPlayer from '@root/core/DocMiniPlayer'
import type { DanType } from '@root/danmaku'
import { useOnce } from '@root/hook'
import configStore, { openSettingPanel } from '@root/store/config'
import vpConfig from '@root/store/vpConfig'
import { createElement, dq1, formatTime } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { dqParents } from '@root/utils/dom'
import { injectFunction } from '@root/utils/injectFunction'
import { runInAction } from 'mobx'
import { useRef, useState, type FC } from 'react'

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
      src={'sample-mp4-file.mp4'}
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
        src={'sample-mp4-file.mp4'}
        className="video2"
        muted
        controls
        height="300"
      ></video>
    </div>
  </div>
)

window.dqParents = dqParents

console.log('process.env.video2Url', process.env.video2Url)
const dans = new Array(255)
  .fill(1)
  .map((_, i) => {
    const time = Math.random() * 120
    return {
      color: '#fff',
      text: `asdfasdfasdfasdfasdfadfs ${formatTime(time)}`,
      time,
      type: 'top',
    } as DanType
  })
  .sort((a, b) => a.time - b.time)

const App: FC = (props) => {
  let [player, setPlayer] = useState<DocMiniPlayer>()
  let [isV2, setV2] = useState(true)
  const mainRef = useRef<HTMLDivElement>()
  window.player = player

  useOnce(() => {
    setPlayer(
      new DocMiniPlayer({
        videoEl: dq1('video'),
        danmu: {
          dans,
        },
      })
    )
    runInAction(() => {
      configStore.vpActionAreaLock = true
      vpConfig.canShowDanmaku = true
      vpConfig.canSendDanmaku = true
    })
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

    // observeVideoEl(dq1('video'), (videoEl) => {
    //   console.log('更换了videoEl', videoEl)
    //   window.player.updateWebVideoPlayerEl(videoEl)
    // })

    // 测试监听
    // 目前得出的是有其他应用窗口挡住当前tab就会setTimeout拉长
    const p = dq1('.main')
    const childObserve = new MutationObserver((list) => {
      const nodes = list[0].addedNodes
      for (const node of nodes) {
        console.log('add Node', node.textContent)
      }
    })
    childObserve.observe(p, { childList: true })
    let i = 0
    const run = () => {
      p.appendChild(createElement('div', { textContent: `添加的${i++}` }))
      setTimeout(run, 100)
    }
    run()

    // const observer = new IntersectionObserver((entries) => {
    //   console.log(
    //     'entries isVisible',
    //     entries[0].isVisible,
    //     'isIntersecting',
    //     entries[0].isIntersecting
    //   )
    // })
    // observer.observe(dq1('.setting'))

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
      <div className="setting">
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

      {/* {new Array(100).fill(1).map((_,i)=><div>)} */}
      {/* <div style={{ height: 1000000 }}></div> */}
    </div>
  )
}

export default App
