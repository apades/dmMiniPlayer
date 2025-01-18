import { isArray } from '@root/utils'
import classNames from 'classnames'
import { useRef, type FC, type PropsWithChildren, type ReactNode } from 'react'

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
