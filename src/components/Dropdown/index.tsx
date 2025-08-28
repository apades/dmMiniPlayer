import Trigger, { TriggerProps } from '@rc-component/trigger'
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
      popupVisible={isVisible}
      onOpenChange={setVisible}
      // popupPlacement="bottomLeft"
      popupAlign={{
        points: ['bl', 'tl'],
        offset: [-4, -6],
      }}
      getPopupContainer={() =>
        containerRef.current?.ownerDocument?.body || document.body
      }
      {...props}
    >
      <div ref={containerRef}>{props.children}</div>
    </Trigger>
  )
}

export default Dropdown
