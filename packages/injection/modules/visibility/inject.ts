import { isUndefined } from '@root/utils'
import { defineInject } from '../../define-inject'

function getDeepGetter<T, K extends keyof T>(
  tar: T,
  key: K,
): (() => any) | null {
  const getter = Object.getOwnPropertyDescriptor(tar, key)?.get
  return (
    getter ??
    (isUndefined(Object.getPrototypeOf(tar))
      ? null
      : getDeepGetter(Object.getPrototypeOf(tar), key))
  )
}

export const visibilityInject = defineInject({
  name: 'visibility',
  setup: (ctx) => {
    let visibilityState: typeof document.visibilityState | undefined
    // 这个getter是不能还原和多次设置的
    if (Object.getOwnPropertyDescriptor(document, 'visibilityState')?.get)
      return

    const originGetter = getDeepGetter(document, 'visibilityState')?.bind(
      document,
    )
    if (!originGetter) throw Error('拿不到document.visibilityState的getter')
    try {
      Object.defineProperty(document, 'visibilityState', {
        get: () => {
          if (visibilityState) return visibilityState
          return originGetter()
        },
      })
    } catch (error) {
      console.error(error)
      throw Error('好像当前浏览器没法注入document.visibilityState的getter')
    }

    ctx.on('alwaysVisible', () => alwaysVisible())
    ctx.on('alwaysHidden', () => alwaysHidden())
    ctx.on('restore', () => restore())

    function alwaysVisible() {
      visibilityState = 'visible'
    }
    function alwaysHidden() {
      visibilityState = 'hidden'
    }
    function restore() {
      visibilityState = undefined
    }
  },
})
