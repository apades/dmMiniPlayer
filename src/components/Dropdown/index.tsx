import useDebounceTimeoutCallback from '@root/hook/useDebounceTimeoutCallback'
import { isArray } from '@root/utils'
import classNames from 'classnames'
import {
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from 'react'

type Props = PropsWithChildren<{
  menuRender: () => ReactNode
}>
const Dropdown: FC<Props> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setVisible] = useState(false)
  const { run, clear } = useDebounceTimeoutCallback(
    () => setVisible(false),
    100,
  )

  if (isArray(props.children)) throw new Error('不要传数组children给该组件')
  return (
    <div
      className="relative group/dropdown"
      style={{ zIndex: 10 }}
      ref={containerRef}
      onMouseEnter={() => {
        setVisible(true)
        clear()
      }}
      onMouseLeave={() => {
        run()
      }}
    >
      <div
        className={classNames(
          'absolute bottom-[calc(100%+4px)] left-[-12px] transition-all origin-bottom',
          'opacity-0 h-0 overflow-hidden',
          isVisible && 'opacity-100 h-calc-auto',
        )}
      >
        {props.menuRender()}
      </div>
      {props.children}
    </div>
  )
}

export default Dropdown
