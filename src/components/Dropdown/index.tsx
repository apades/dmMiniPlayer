import { isArray } from '@root/utils'
import {
  useRef,
  type FC,
  Children,
  type PropsWithChildren,
  cloneElement,
  type ReactNode,
} from 'react'

type Props = PropsWithChildren<{
  menuRender: () => ReactNode
}>
const Dropdown: FC<Props> = (props) => {
  const childRef = useRef<HTMLElement>()

  if (isArray(props.children)) throw new Error('不要传数组children给该组件')
  return (
    <div className="relative group" style={{ zIndex: 10 }}>
      {/* TODO 改成algin参数可以调整 */}
      <div className="absolute bottom-full left-[-12px] invisible group-hover:visible dp:pb-[4px] pb-[14px]">
        {props.menuRender()}
      </div>
      {/* {Children.map(props.children, (child, index) =>
        cloneElement(child as any, {
          ref: (ref: any) => {
            childRef.current = ref
          },
        })
      )} */}
      {props.children}
    </div>
  )
}

export default Dropdown
