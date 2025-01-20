import { isArray } from '@root/utils'
import classNames from 'classnames'
import {
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import Trigger, { TriggerProps } from '@rc-component/trigger'
import '@rc-component/trigger/assets/index.css'

type Props = PropsWithChildren<{
  menuRender: () => ReactNode
}> &
  Omit<TriggerProps, 'popup'>
const Dropdown: FC<Props> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setVisible] = useState(false)

  return (
    <Trigger
      popup={props.menuRender}
      action={['hover']}
      popupClassName={classNames(
        'transition-[opacity,scale]',
        'opacity-0 scale-y-0',
        isVisible && 'opacity-100 scale-y-100',
      )}
      onPopupVisibleChange={setVisible}
      // popupPlacement="bottomLeft"
      popupAlign={{
        points: ['bl', 'tl'],
        offset: [-4, 0],
      }}
      {...props}
    >
      {props.children}
    </Trigger>
  )

  if (isArray(props.children)) throw new Error('不要传数组children给该组件')
  return (
    <div
      className="relative group/dropdown"
      style={{ zIndex: 10 }}
      ref={containerRef}
    >
      <div
        className={classNames(
          'absolute bottom-full left-[-12px] pb-[4px] transition-all origin-bottom',
          'opacity-0 scale-y-0',
          'group-hover/dropdown:opacity-100 group-hover/dropdown:scale-y-100',
        )}
      >
        {props.menuRender()}
      </div>
      {props.children}
    </div>
  )
}

export default Dropdown
