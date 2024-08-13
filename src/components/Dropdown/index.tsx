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
  const { run, clear } = useDebounceTimeoutCallback(() => {
    setVisible(false)
  }, 200)

  if (isArray(props.children)) throw new Error('不要传数组children给该组件')
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clear()
        setVisible(true)
      }}
      onMouseLeave={() => {
        run(() => setVisible(true))
      }}
      style={{ zIndex: 10 }}
      ref={containerRef}
    >
      <div
        className={classNames(
          'absolute bottom-full left-[-12px] pb-[4px] transition-all origin-bottom',
          isVisible ? 'scale-y-100' : 'scale-y-0'
        )}
      >
        {props.menuRender()}
      </div>
      {props.children}
    </div>
  )
}

export default Dropdown
