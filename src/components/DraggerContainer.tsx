import classNames from 'classnames'
import { isObject } from 'lodash-es'
import {
  Children,
  type FC,
  type ReactNode,
  cloneElement,
  useEffect,
  useRef,
  useState,
} from 'react'
import Draggable, {
  type DraggableEvent,
  type DraggableProps,
} from 'react-draggable'

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
  const [isDragging, setDragging] = useState(false)
  const nodeRef = useRef<HTMLDivElement>()
  const [x, setX] = useState(initPosition.x)
  const [y, setY] = useState(initPosition.y)

  useEffect(() => {
    if (!props.bounds || !isObject(props.bounds)) return

    console.log('props.bounds', props.bounds)
    const { left, right, top, bottom } = props.bounds
    if (left && x < left) setX(left)
    if (right && x > right) setX(right)
    if (top && y < top) setY(top)
    if (bottom && y > bottom) setY(bottom)
  }, [props.bounds])

  const getNowAbsPos = (e: DraggableEvent) => {
    const _e = e as any
    return Math.sqrt(_e.pageY ** 2 + _e.pageX ** 2)
  }
  useEffect(() => {
    onLastPosChange?.({ x, y })
  }, [x, y])

  const [mouseDowTarget, setMouseDowTarget] = useState<HTMLElement>()
  return (
    <Draggable
      nodeRef={nodeRef as any}
      position={{ x, y }}
      onDrag={(e, data) => {
        const pos = getNowAbsPos(e)
        if (Math.abs(startPos - pos) >= clickSensitive) {
          setDragging(true)
        }
        setX(data.x)
        setY(data.y)
        onDrag?.(e, data)
      }}
      onStart={(e, data) => {
        const pos = getNowAbsPos(e)
        setStartPos(pos)
        onStart?.(e, data)
        setMouseDowTarget(e.target as HTMLElement)
      }}
      onStop={(e, data) => {
        const pos = getNowAbsPos(e)
        if (!isDragging && Math.abs(startPos - pos) <= clickSensitive) {
          onClick?.(e)
        }
        if (!isDragging && mouseDowTarget) {
          mouseDowTarget.dispatchEvent(
            new MouseEvent('click', {
              bubbles: true,
            }),
          )
        }
        setDragging(false)
        setMouseDowTarget(undefined)
        onStop?.(e, data)
      }}
      {..._props}
      defaultClassName={classNames(
        props.defaultClassName,
        mouseDowTarget && 'pointer-events-none select-none',
        isDragging && 'cursor-grabbing',
      )}
    >
      {cloneElement(Children.only(props.children) as any, {
        ref: (node: any) => {
          nodeRef.current = node

          if ((Children.only(props.children) as any)?.ref) {
            ;(Children.only(props.children) as any).ref.current = node
          }
        },
      })}
    </Draggable>
  )
}

export default DraggerContainer
