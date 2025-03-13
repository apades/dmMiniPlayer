import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { FC, useContext, useRef, useState } from 'react'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { useOnce } from '@root/hook'
import classNames from 'classnames'
import { ownerWindow, wait } from '@root/utils'
import Events2 from '@root/utils/Events2'
import Iconfont from '../Iconfont'
import vpContext from './context'

const eventBus = new Events2<{
  visible: void
  hidden: void
  initd: void
}>()

type Props = {
  danmakuSender?: DanmakuSender
}
const DanmakuInputIconInner: FC<Props> = (props) => {
  const [isInitd, setInitd] = useState(false)

  useOnce(() => {
    return eventBus.on2('initd', () => {
      setInitd(true)
    })
  })

  if (!isInitd) return

  return (
    <div>
      <div
        className="p-[5px] cursor-pointer rounded-sm transition-colors hover:bg-[#333]"
        onClick={() => {
          eventBus.emit('visible')
        }}
      >
        <Iconfont size={16} type="input" />
      </div>
    </div>
  )
}

export const DanmakuInputIcon: FC<Props> = (props) => {
  if (!props.danmakuSender) return null
  return <DanmakuInputIconInner {...props} />
}

const DanmakuInputInner: FC<Props> = (props) => {
  const { keydownWindow } = useContext(vpContext)
  const [isVisible, setVisible] = useState(false)
  const [isInitd, setInitd] = useState(false)
  const danmakuInputRef = useRef<HTMLInputElement>(null)

  useTargetEventListener(
    'keydown',
    (e) => {
      if (!isInitd) return
      const tar = e.target as HTMLElement

      if (e.code !== 'Enter') return
      if (
        tar.tagName === 'TEXTAREA' ||
        tar.tagName === 'INPUT' ||
        tar.contentEditable === 'true'
      )
        return
      eventBus.emit('visible')
    },
    keydownWindow,
  )

  useOnce(() => {
    if (!danmakuInputRef.current || !props.danmakuSender) return
    props.danmakuSender.setData({
      textInput: danmakuInputRef.current,
    })
    try {
      props.danmakuSender.init()
      eventBus.emit('initd')
      setInitd(true)
    } catch (error) {
      console.error(error)
    }

    return () => {
      if (!props.danmakuSender) return
      props.danmakuSender.unload()
      props.danmakuSender.setData({
        textInput: undefined,
      })
    }
  })

  useOnce(() => {
    return eventBus.on2('visible', () => {
      setVisible(true)
      danmakuInputRef.current?.focus()
    })
  })

  return (
    <div
      className={classNames(
        'fixed transition-all z-[20] left-0 w-full bg-[#0007] px-5 py-2 duration-500',
        isVisible ? 'bottom-0 opacity-100' : '-bottom-10 opacity-0',
      )}
    >
      <input
        ref={danmakuInputRef}
        onBlur={() => {
          setVisible(false)
          danmakuInputRef.current?.blur()
        }}
        onKeyDown={(e) => {
          if (e.code == 'Escape') {
            e.stopPropagation()
            danmakuInputRef.current?.blur()
          }

          if (e.key === 'Enter') {
            e.stopPropagation()
            e.preventDefault()
            props.danmakuSender?.send()
          }
        }}
        className="text-black h-6 focus-visible:outline-none rounded-md px-2 w-full"
      />
    </div>
  )
}

export const DanmakuInput: FC<Props> = (props) => {
  if (!props.danmakuSender) return null
  return <DanmakuInputInner {...props} />
}
