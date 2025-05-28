import Slider from '@mui/material/Slider'
import IconButton from '@root/components/IconButton'
import Iconfont from '@root/components/Iconfont'
import type { FC } from 'react'

const App: FC = (props) => {
  return (
    <div>
      asdfadf
      <div>
        <IconButton size={30}>
          <Iconfont type="input" size={24} />
        </IconButton>
      </div>
      <Slider
        defaultValue={[0, 30]}
        onChange={(val) => console.log('val', val)}
      />
    </div>
  )
}
export default App
