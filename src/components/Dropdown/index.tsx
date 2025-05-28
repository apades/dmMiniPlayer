import { isArray } from '@root/utils'
import classNames from 'classnames'
import { type FC, type PropsWithChildren, type ReactNode, useRef } from 'react'

type Props = PropsWithChildren<{
  menuRender: () => ReactNode
}>
const Dropdown: FC<Props> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)

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
          'opacity-0 h-0 overflow-hidden',
          'group-hover/dropdown:opacity-100 group-hover/dropdown:h-calc-auto',
        )}
      >
        {props.menuRender()}
      </div>
      {props.children}
    </div>
  )
}

export default Dropdown
