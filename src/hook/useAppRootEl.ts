import { createElement } from '@root/utils'
import { createContext, RefObject, useContext } from 'react'

export const appRootContext = createContext<{
  rootRef: RefObject<HTMLElement | null>
}>({
  rootRef: { current: null },
})

export function useAppRootElRef() {
  return useContext(appRootContext).rootRef
}
