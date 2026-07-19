import Tabs from '@root/components/Tabs'
import { type FC } from 'react'

const App: FC = (props) => {
  return (
    <div>
      <div className="w-[300px] relative mt-[300px]">
        <div onClick={() => console.log('click me')}>click me</div>
        <div className="border-[red] border-[1px]"> tabs header </div>
        <div className="absolute bottom-5 left-0">
          <Tabs
            tabs={[
              {
                label: <button>adasd</button>,
                value: 'tab1',
                content: (
                  <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                    <li>Item 4</li>
                    <li>Item 5</li>
                    <li>Item 6</li>
                    <li>Item 7</li>
                    <li>Item 8</li>
                    <li>Item 9</li>
                    <li>Item 10</li>
                  </ul>
                ),
              },
              {
                label: 'Tab 2',
                value: 'tab2',
                content: <div>Tab 2 sadsad</div>,
              },
            ]}
            adjustContent="bottom"
          ></Tabs>
        </div>
      </div>
    </div>
  )
}
export default App
