import classNames from 'classnames'
import type { FC, ReactNode } from 'react'

const Modal: FC<{
  className?: string
  fullWidth?: boolean
  isOpen: boolean
  /**关闭modal，可保留组件的动画 */
  onClose: () => void
  children?: ReactNode
}> = (props) => {
  return (
    <div
      className="fixed left-0 top-0 size-full z-[9999] f-center"
      style={{
        '--top': 'clamp(0px, 10vh, 200px)',
      }}
    >
      <div
        className={classNames(
          'relative z-[2] bg-[#111a]',
          'overflow-y-auto custom-scrollbar text-white max-h-[calc(100%-var(--top)*2)]',
          !props.fullWidth ? 'max-w-[600px]' : 'min-w-fit',
          props.className,
        )}
      >
        {props.children}
      </div>
      <div
        className={classNames(
          'absolute z-[1] left-0 top-0 size-full',
          'bg-[#0007]',
        )}
        onClick={props.onClose}
      />
    </div>
  )
}

export default Modal
