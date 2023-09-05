/**@deprecated */
import { useOnce } from '@root/hook'
import { useEventListener, useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { useRef, type FC, useState } from 'react'
import Browser from 'webextension-polyfill'

export function initVideoFloatBtn(vel: HTMLElement) {}

const timeout = 2000
const Btn: FC<{ vel: HTMLElement }> = (props) => {
  let [isHidden, setHidden] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEventListener(
    'mousemove',
    () => {
      setHidden(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setHidden(false)
      }, timeout)
    },
    { target: props.vel }
  )
  useEventListener(
    'mouseleave',
    () => {
      clearTimeout(timerRef.current)
      setHidden(false)
    },
    { target: props.vel }
  )
  const onMouseEnter = useMemoizedFn(() => {
    clearTimeout(timerRef.current)
    setHidden(false)
  })
  const onClick = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation()
      const event = new CustomEvent('inject-request', {
        detail: { type: 'start-PIP', data: { videoEl: props.vel } },
      })
      window.dispatchEvent(event)
    }
  )

  return (
    <div
      className={classNames('rc-float-btn f-i-center', isHidden && 'hidden')}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <img src={`${Browser.runtime.getURL('/assets/icon.png')}`} />
    </div>
  )
}
