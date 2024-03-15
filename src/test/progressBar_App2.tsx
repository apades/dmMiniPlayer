import { Dropdown } from 'antd'
import type { FC } from 'react'

const App2: FC = (props) => {
  return (
    <div>
      <Dropdown
        menu={{ items: [{ key: 'a', label: 'asdf' }] }}
        getPopupContainer={(ref) => ref}
      >
        <div>
          asdfadf
          {/* <Slider
                range
                defaultValue={[0, 30]}
                draggableTrack
                onChange={(val) => console.log('val', val)}
              /> */}
        </div>
      </Dropdown>
    </div>
  )
}

export default App2
