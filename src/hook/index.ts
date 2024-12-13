import { OrPromise } from '@root/utils/typeUtils'
import { useEffect } from 'react'

export function useOnce(
  cb: (stats: {
    /**在async中可以通过这个判断await过后的代码要不要继续执行 */
    readonly isUnmounted: boolean
  }) => OrPromise<void | (() => void)>,
): void {
  return useEffect(() => {
    let isUnmounted = false
    const state = {
      get isUnmounted() {
        return isUnmounted
      },
    }

    const onUnmount = () => {
      isUnmounted = true
    }

    try {
      const res = cb(state)
      if (res instanceof Promise) {
        return () => {
          onUnmount()
        }
      } else {
        return () => {
          onUnmount()
          res?.()
        }
      }
    } catch (error) {}
  }, [])
}
