import { useMemoizedFn } from 'ahooks'
import { useRef } from 'react'

/**
 * 立即运行run传入的函数，settimeout运行use传入的callback函数。重复运行run会重置settimeout
 */
function useDebounceTimeoutCallback(callback: () => void, timeout = 500) {
  const timerRef = useRef<NodeJS.Timeout>(null)

  const run = useMemoizedFn((fn?: () => void) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    fn?.()
    timerRef.current = setTimeout(() => {
      callback()
    }, timeout)
  })

  const clear = useMemoizedFn(() => {
    timerRef.current && clearTimeout(timerRef.current)
  })

  return {
    run,
    clear,
  }
}

export default useDebounceTimeoutCallback
