import vpConfig from '@root/store/vpConfig'
import { wait } from '@root/utils'
import { useEffect, useRef, type FC } from 'react'
import Iconfont from '../Iconfont'
import configStore from '@root/store/config'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'

const DanmakuInput: FC<{
  setActionAreaLock: (b: boolean) => void
  setInputMode: React.Dispatch<React.SetStateAction<boolean>>
  danmakuSender: DanmakuSender
}> = (props) => {
  const danmakuInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!danmakuInputRef.current) return
    props.danmakuSender.setData({
      textInput: danmakuInputRef.current,
    })
    props.danmakuSender.init()

    return () => {
      props.danmakuSender.unload()
      props.danmakuSender.setData({
        textInput: undefined,
      })
    }
  }, [danmakuInputRef.current])

  return (
    <div className="barrage-input">
      {vpConfig.canSendDanmaku && (
        <Iconfont
          type="input"
          onClick={() => {
            props.setInputMode((v) => {
              if (!v) {
                wait().then(() => danmakuInputRef.current?.focus())
              }
              return !v
            })
          }}
          style={{ fontSize: 16, cursor: 'pointer', lineHeight: 0 }}
        />
      )}
      <input
        ref={danmakuInputRef}
        onFocus={() => {
          props.setActionAreaLock(true)
        }}
        onBlur={() => {
          if (configStore.vpActionAreaLock) return
          props.setActionAreaLock(false)
        }}
        onKeyDown={(e) => {
          if (e.code == 'Escape') {
            danmakuInputRef.current?.blur()
          }

          if (e.key === 'Enter') {
            e.preventDefault()
            props.danmakuSender.send()
          }
        }}
        className="text-black"
      />
    </div>
  )
}

export default DanmakuInput
