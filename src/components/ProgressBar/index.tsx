import Slider from '@apad/rc-slider'
import { type SliderProps } from '@apad/rc-slider'
import classNames from 'classnames'
import {
  type CSSProperties,
  type FC,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react'

type Props = {
  className?: string
  style?: CSSProperties
  width?: number
  onClick?: (percent: number) => void
  direction?: 'v' | 'h'
  percent?: number
  loadColor?: CSSProperties['backgroundColor']
  bgColor?: CSSProperties['backgroundColor']
  disableHoverStyle?: boolean
  children?: ReactElement
} & SliderProps
const ProgressBar: FC<Props> = (props) => {
  let {
    className = '',
    direction = 'h',
    onClick = () => 1,
    percent = 20,
    loadColor = '#D8D8D8',
    bgColor = '#f5f5f5',
    style = {},
    width = '100%',
    ..._props
  } = props

  let barBgColor = bgColor

  let progressDragTimmer = useRef<NodeJS.Timeout>()
  let [isProgressDragging, setProgressDragging] = useState(false)
  useEffect(() => {
    if (isProgressDragging) {
      progressDragTimmer.current && clearTimeout(progressDragTimmer.current)
      progressDragTimmer.current = setTimeout(() => {
        setProgressDragging(false)
      }, 1000)
    }
  }, [isProgressDragging])

  return (
    <Slider
      value={percent}
      className={classNames(
        'progress-bar',
        className,
        isProgressDragging && 'is-dragging',
        props.disableHoverStyle && 'disable-hover'
      )}
      vertical={direction === 'v'}
      onChange={(v: number) => {
        setProgressDragging(true)
        onClick(v)
      }}
      style={
        {
          width: direction === 'h' ? '100%' : width,
          height: direction === 'h' ? width : '100%',
          '--bg-color': barBgColor,
          '--load-color': loadColor,
          ...style,
        } as CSSProperties
      }
      {..._props}
    ></Slider>
  )
}

export default ProgressBar
