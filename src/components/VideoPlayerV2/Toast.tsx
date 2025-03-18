import { FC, useContext } from 'react'
import { useToaster, toast } from 'react-hot-toast'
import { useOnce } from '@root/hook'
import { PlayerEvent } from '@root/core/event'
import { isString } from 'lodash-es'
import vpContext from './context'

const Toast: FC = (props) => {
  const { toasts, handlers } = useToaster()
  const { startPause, endPause, calculateOffset, updateHeight } = handlers

  const { eventBus } = useContext(vpContext)
  useOnce(() =>
    eventBus.on2(PlayerEvent.toast, (data) => {
      if (isString(data)) {
        return toast(data)
      }
      switch (data.type) {
        case 'error':
        case 'success':
        case 'loading':
        case 'custom':
          return toast[data.type](data.msg, data)
        case 'remove':
        case 'dismiss':
          return toast[data.type](data.id)
      }
    }),
  )

  return (
    <div
      className="fixed w-full top-0 left-0 px-2 py-2"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      {toasts.map((toast) => {
        console.log('toast', toast)
        const offset = calculateOffset(toast, {
          reverseOrder: false,
          gutter: 8,
        })

        const icon = (() => {
          switch (toast.type) {
            case 'error':
              return '🔴'
            case 'success':
              return '🟢'

            default:
              return ''
          }
        })()

        return (
          <div
            key={toast.id}
            ref={(el) => {
              if (el && typeof toast.height !== 'number') {
                const height = el.getBoundingClientRect().height
                updateHeight(toast.id, height)
              }
            }}
            className="bg-[#26262680] text-white px-2 text-[14px] max-w-[80%]"
            style={{
              position: 'absolute',
              transition: 'all 0.5s ease-out',
              opacity: toast.visible ? 1 : 0,
              transform: `translateY(${offset}px)`,
            }}
            {...toast.ariaProps}
          >
            {icon} {toast.message as any}
          </div>
        )
      })}
    </div>
  )
}

export default Toast

window.toast = toast
