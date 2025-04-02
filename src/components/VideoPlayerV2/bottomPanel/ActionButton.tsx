import HiddenAble from '@root/components/HiddenAble'
import classNames from 'classnames'
import { FC, HTMLAttributes, PropsWithChildren } from 'react'

type Props = {
  isUnActive?: boolean
} & PropsWithChildren &
  HTMLAttributes<HTMLDivElement>
const ActionButton: FC<Props> = (props) => {
  const { isUnActive, ..._props } = props
  return (
    // <HiddenAble>
    <div
      {..._props}
      className={classNames(
        'p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors leading-[18px]',
        isUnActive && 'opacity-50',
        props.className,
      )}
    ></div>
    // </HiddenAble>
  )
}

export default ActionButton
