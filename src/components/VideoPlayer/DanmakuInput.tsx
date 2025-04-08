import { wait } from '@root/utils'
import { useContext, useEffect, useRef, useState, type FC } from 'react'
import configStore from '@root/store/config'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import Iconfont from '../Iconfont'
import vpContext from '../VideoPlayerV2/context'

const DanmakuInput: FC<{
  setActionAreaLock: (b: boolean) => void
  setInputMode: React.Dispatch<React.SetStateAction<boolean>>
  danmakuSender: DanmakuSender
}> = (props) => {
  const danmakuInputRef = useRef<HTMLInputElement>(null)
  const [isErr, setErr] = useState(false)
  const { videoPlayer } = useContext(vpContext)

  useEffect(() => {
    if (!danmakuInputRef.current) return
    props.danmakuSender.setData({
      textInput: danmakuInputRef.current,
    })
    try {
      props.danmakuSender.init()
    } catch (error) {
      console.error(error)
      setErr(true)
    }

    return () => {
      props.danmakuSender.unload()
      props.danmakuSender.setData({
        textInput: undefined,
      })
      setErr(false)
    }
  }, [danmakuInputRef.current])

  return (
    <div
      className="barrage-input"
      style={{ display: isErr ? 'none' : undefined }}
    >
      {videoPlayer?.canSendDanmaku && (
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
