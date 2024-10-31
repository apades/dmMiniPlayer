import { Children, FC, ReactNode, useEffect, useRef, useState } from 'react'
import Draggable, { DraggableEvent, DraggableProps } from 'react-draggable'

type Props = {
  onClick?: (e: DraggableEvent) => void
  children: ReactNode
  onLastPosChange?: (data: { x: number; y: number }) => void
  initPosition?: { x: number; y: number }
  /**点击灵敏度，点击会不可避免导致鼠标轻微移动，不超出移动范围都可以算是触发点击 */
  clickSensitive?: number
} & Partial<DraggableProps>
const DraggerContainer: FC<Props> = (props) => {
  const {
    onStart,
    onDrag,
    onStop,
    onClick,
    children,
    onLastPosChange,
    initPosition = { x: 0, y: 0 },
    clickSensitive = 5,
    ..._props
  } = props
  const [startPos, setStartPos] = useState(0)
  const [isDraging, setDraging] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)
  const [x, setx] = useState(initPosition.x)
  const [y, sety] = useState(initPosition.y)

  const getNowAbsPos = (e: DraggableEvent) => {
    const _e = e as any
    return Math.sqrt(_e.pageY ** 2 + _e.pageX ** 2)
  }
  useEffect(() => {
    onLastPosChange?.({ x, y })
  }, [x, y])

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x, y }}
      onDrag={(e, data) => {
        const pos = getNowAbsPos(e)
        if (Math.abs(startPos - pos) >= clickSensitive) {
          setDraging(true)
        }
        setx(data.x)
        sety(data.y)
        onDrag?.(e, data)
      }}
      onStart={(e, data) => {
        const pos = getNowAbsPos(e)
        setStartPos(pos)
        onStart?.(e, data)
      }}
      onStop={(e, data) => {
        const pos = getNowAbsPos(e)
        if (!isDraging && Math.abs(startPos - pos) <= clickSensitive) {
          onClick?.(e)
        }
        console.log('end', data.x, data.y)
        setDraging(false)
        onStop?.(e, data)
      }}
      {..._props}
    >
      <div
        ref={nodeRef}
        style={{
          pointerEvents: isDraging ? 'none' : 'all',
          userSelect: isDraging ? 'none' : 'initial',
        }}
      >
        {children}
      </div>
    </Draggable>
  )
}

export default DraggerContainer
