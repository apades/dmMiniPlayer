import DocMiniPlayer from '@root/core/DocMiniPlayer'
import MiniPlayer from '@root/core/miniPlayer'
import { useOnce } from '@root/hook'
import { openSettingPanel } from '@root/store/config'
import '@apad/setting-panel/lib/index.css'
import { dq1 } from '@root/utils'
import { useState, type FC } from 'react'
import AsyncLock from '@root/utils/AsyncLock'

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

const App: FC = (props) => {
  let [player, setPlayer] = useState(
    new DocMiniPlayer({
      videoEl: dq1('video'),
    })
  )
  window.player = player

  return (
    <div>
      <button onClick={() => player.openPlayer()}>open</button>
      <button onClick={() => openSettingPanel()}>setting</button>
      <button
        onClick={async () => {
          await trustLock.waiting()
          let pipWindow = await window.documentPictureInPicture.requestWindow()
          pipWindow.document.body.appendChild(dq1('video'))
        }}
      >
        add Video to PIP
      </button>
    </div>
  )
}

export default App
