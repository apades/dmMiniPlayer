import { forwardRef } from 'react'

const BarrageInput = forwardRef<
  HTMLInputElement,
  { setActionAreaLock: (b: boolean) => void }
>((props, ref) => {
  return (
    <div className="barrage-input f-i-center">
      <input
        ref={ref}
        onFocus={() => {
          props.setActionAreaLock(true)
        }}
        onBlur={() => {
          props.setActionAreaLock(false)
        }}
        onKeyDown={(e) => {
          if (e.code == 'Escape') (e.target as HTMLInputElement).blur()
        }}
      />
    </div>
  )
})

export default BarrageInput
