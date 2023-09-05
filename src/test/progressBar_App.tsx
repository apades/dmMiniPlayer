import type { FC } from 'react'
import Slider from '../../../../slef project origin/slider/es/Slider'
import '../../../../slef project origin/slider/assets/index.css'

const App: FC = (props) => {
  return (
    <div>
      <Slider
        range
        defaultValue={[0, 30]}
        draggableTrack
        onChange={(val) => console.log('val', val)}
      />
    </div>
  )
}
export default App
