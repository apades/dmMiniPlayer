import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { FC, useContext, useEffect, useRef, useState } from 'react'
import vpContext from './context'
import useTargetEventListener from '@root/hook/useTargetEventListener'
import { useOnce } from '@root/hook'
import classNames from 'classnames'
import { wait } from '@root/utils'
import Iconfont from '../Iconfont'

type Props = {
  danmakuSender?: DanmakuSender
}
const DanmakuInputInner: FC<Props> = (props) => {
  const { keydownWindow } = useContext(vpContext)
  const [isVisible, setVisible] = useState(false)
  const [isInitd, setInitd] = useState(false)
  const danmakuInputRef = useRef<HTMLInputElement>(null)

  useOnce(() => {
    if (!danmakuInputRef.current || !props.danmakuSender) return
    props.danmakuSender.setData({
      textInput: danmakuInputRef.current,
    })
    try {
      props.danmakuSender.init()
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
      setInitd(false)
    }
  })

  useTargetEventListener(
    'keydown',
    (e) => {
      if (!isInitd) return
      const tar = e.target as HTMLElement
      if (
        tar.tagName === 'TEXTAREA' ||
        tar.tagName === 'INPUT' ||
        tar.contentEditable === 'true'
      )
        return

      setVisible(true)
      danmakuInputRef.current?.focus()
    },
    keydownWindow ?? window
  )

  return (
    <>
      <div className={classNames(isInitd ? 'visible' : 'invisible')}>
        <div
          className="p-1 cursor-pointer rounded-sm transition-colors hover:bg-[#333]"
          onClick={() => {
            setVisible(true)
            danmakuInputRef.current?.focus()
          }}
        >
          <Iconfont type="input" />
        </div>
      </div>

      <div
        className={classNames(
          'fixed transition-all z-11 left-0 w-full bg-[#0007] px-5 py-2 duration-500',
          isVisible ? 'translate-0 opacity-100' : 'translate-y-10 opacity-0'
        )}
      >
        <input
          ref={danmakuInputRef}
          onBlur={() => {
            setVisible(false)
          }}
          onKeyDown={(e) => {
            if (e.code == 'Escape') {
              danmakuInputRef.current?.blur()
            }

            if (e.key === 'Enter') {
              e.preventDefault()
              props.danmakuSender?.send()
            }
          }}
          className="text-black h-6 focus-visible:outline-none rounded-md px-2 w-full"
        />
      </div>
    </>
  )
}

const DanmakuInput: FC<Props> = (props) => {
  console.log('props.danmakuSender', props.danmakuSender)
  if (!props.danmakuSender) return null
  return <DanmakuInputInner {...props} />
}
export default DanmakuInput
