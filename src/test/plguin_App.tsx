import DocMiniPlayer from '@root/core/DocMiniPlayer'
import MiniPlayer from '@root/core/miniPlayer'
import { useOnce } from '@root/hook'
import { dq1 } from '@root/utils'
import { useState, type FC } from 'react'

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
    </div>
  )
}

export default App
