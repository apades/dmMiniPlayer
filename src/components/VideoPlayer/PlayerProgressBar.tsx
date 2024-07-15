import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import ProgressBar from '../ProgressBar'
import { useEventListener } from 'ahooks'
import { dq1, formatTime } from '@root/utils'
import classNames from 'classnames'
import { HandlesProps } from '@apad/rc-slider/lib/Handles'
import { useOnce } from '@root/hook'

type Props = {
  playedPercent: number
  onClick: (percent: number) => void
  loaded: { s: number; e: number }[]
  duration: number
}
const PlayerProgressBar: FC<Props> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="played-progress-bar">
      <ProgressBar
        percent={props.playedPercent}
        onClick={props.onClick}
        loadColor="#0669ff"
        handleRender={(node, _props) => {
          return <HandleWithToolTips {..._props} duration={props.duration} />
        }}
      >
        <div className="bar-loaded">
          {props.loaded.map(({ s, e }) => (
            <span
              key={s}
              style={{
                left: `${(s / props.duration) * 100}%`,
                width: `${((e - s) / props.duration) * 100}%`,
                top: 0,
              }}
            ></span>
          ))}
        </div>
      </ProgressBar>

      <ToolTips containerRef={containerRef} duration={props.duration} />
    </div>
  )
}

const HandleWithToolTips: FC<
  Parameters<Required<HandlesProps>['handleRender']>[1] & { duration: number }
> = (props) => {
  const [isVisible, setVisible] = useState(false)
  const handleRef = useRef<HTMLDivElement>()
  const [isInitd, setInitd] = useState(false)
  useOnce(() => {
    setInitd(true)
  })

  useEventListener(
    'mouseleave',
    () => {
      if (!isInitd) return
      if (!handleRef.current) return
      setVisible(false)
    },
    { target: handleRef.current }
  )
  useEventListener(
    'mouseenter',
    () => {
      if (!isInitd) return
      if (!handleRef.current) return
      setVisible(true)
    },
    { target: handleRef.current }
  )

  return (
    <div
      ref={handleRef}
      className="rc-slider-handle -translate-x-1/2"
      style={{
        left: `${props.value}%`,
      }}
    >
      <div
        className={classNames(
          isVisible || props.dragging ? 'opacity-100' : 'opacity-0',
          'handle-tooltips pointer-events-none',
          'absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2 bg-[#fff3] rounded-[2px] px-[4px] py-[2px]'
        )}
      >
        {formatTime(props.duration * (props.value / 100))}
      </div>
    </div>
  )
}

type ToolTipsProps = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  duration: number
}
const ToolTips: FC<ToolTipsProps> = (props) => {
  const { containerRef, duration } = props
  const [isVisible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const [isInitd, setInitd] = useState(false)
  useOnce(() => {
    setInitd(true)
  })

  useEventListener(
    'mousemove',
    (e) => {
      if (!isInitd) return
      if (!containerRef.current) return
      const target = e.target as HTMLElement
      if (target.classList.contains('rc-slider-handle')) {
        return setVisible(false)
      }

      const percent = (e.offsetX / containerRef.current.clientWidth) * 100
      setVisible(true)
      // containerRef.current.style.setProperty('--percent', `${percent}%`)
      setPercent(percent)
    },
    { target: containerRef.current }
  )
  useEventListener('mouseleave', () => [setVisible(false)], {
    target: containerRef.current,
  })
  useEventListener(
    'mousedown',
    () => {
      if (!isInitd) return
      if (!containerRef.current) return
      setVisible(false)
    },
    { target: containerRef.current }
  )

  return (
    <div
      className={classNames(
        isVisible ? 'opacity-100' : 'opacity-0',
        'absolute bottom-[calc(100%+4px)] -translate-x-1/2 bg-[#fff3] rounded-[2px] px-[4px] py-[2px] pointer-events-none'
      )}
      style={{
        left: `${percent}%`,
      }}
    >
      {formatTime(duration * (percent / 100))}
    </div>
  )
}
export default PlayerProgressBar
