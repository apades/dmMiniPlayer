import vpConfig from '@root/store/vpConfig'
import { wait } from '@root/utils'
import { useRef, type FC } from 'react'
import Iconfont from '../Iconfont'
import configStore from '@root/store/config'

const BarrageInput: FC<{
  setActionAreaLock: (b: boolean) => void
  setInputMode: React.Dispatch<React.SetStateAction<boolean>>
}> = (props) => {
  const barrageInputRef = useRef<HTMLInputElement>()
  return (
    <div className="barrage-input">
      {vpConfig.canSendBarrage && (
        <Iconfont
          type="input"
          onClick={() => {
            props.setInputMode((v) => {
              if (!v) {
                wait().then(() => barrageInputRef.current.focus())
              }
              return !v
            })
          }}
          style={{ fontSize: 16, cursor: 'pointer', lineHeight: 0 }}
        />
      )}
      <input
        ref={barrageInputRef}
        onFocus={() => {
          props.setActionAreaLock(true)
        }}
        onBlur={() => {
          if (configStore.vpActionAreaLock) return
          props.setActionAreaLock(false)
        }}
        onKeyDown={(e) => {
          if (e.code == 'Escape') barrageInputRef.current.blur()
        }}
        className="text-black"
      />
    </div>
  )
}

export default BarrageInput
