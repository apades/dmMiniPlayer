import type { OrPromise } from '@root/utils/typeUtils'
import { useMemoizedFn } from 'ahooks'
import { useEffect, useState } from 'react'

export function useOnce(
  cb: (stats: {
    /**在async中可以通过这个判断await过后的代码要不要继续执行 */
    readonly isUnmounted: boolean
  }) => OrPromise<void | (() => void)>,
): void {
  // biome-ignore lint/correctness/noVoidTypeReturn: <explanation>
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
      }
      return () => {
        onUnmount()
        res?.()
      }
    } catch (error) {}
  }, [])
}

export function useAction(fn: () => OrPromise<any>, defaultLoading = false) {
  const [isLoading, setLoading] = useState(defaultLoading)

  const action = useMemoizedFn(async () => {
    setLoading(true)
    try {
      await fn()
    } finally {
      console.log('finally')
      setLoading(false)
    }
  })

  return [isLoading, action] as const
}
