import classNames from 'classnames'
import { FC, ReactNode } from 'react'

const Modal: FC<{
  isOpen: boolean
  /**关闭modal，可保留组件的动画 */
  onClose: () => void
  children?: ReactNode
}> = (props) => {
  return (
    <div
      className="fixed left-0 top-0 size-full z-[9999]"
      style={{
        '--top': 'clamp(0px, 20vh, 200px)',
      }}
    >
      <div
        className={classNames(
          'absolute z-[2] left-1/2 -translate-x-1/2 top-[var(--top)]',
          'max-w-[600px] max-h-[calc(100vh-var(--top)*2)] overflow-y-auto custom-scrollbar bg-[#111a] text-white',
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
      ></div>
    </div>
  )
}

export default Modal
