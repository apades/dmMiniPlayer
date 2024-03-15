import { useRef, useMemo, type FC } from 'react'
// import Slider from '../../../../slef project origin/slider/es/Slider'
// import '../../../../slef project origin/slider/assets/index.css'
import { Dropdown, ConfigProvider } from 'antd'
import { StyleProvider, createCache } from '@ant-design/cssinjs'

const App: FC = (props) => {
  const cache = useMemo(() => createCache(), [createCache])
  console.log('cache', cache)
  const styleRef = useRef<HTMLDivElement>()
  return (
    <StyleProvider cache={cache} container={styleRef.current}>
      <div ref={styleRef}></div>
      <ConfigProvider>
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
      </ConfigProvider>
    </StyleProvider>
  )
}
export default App
