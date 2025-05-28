import type { PartialIncludes } from '@root/utils/typeUtils'
import { useMemoizedFn } from 'ahooks'
import { isUndefined } from 'lodash-es'
import { FC, type ReactNode, useEffect, useRef, useState } from 'react'

/**用来打开独立于App的modal, context需要放在同级的reactNode中 */
export default function useOpenIsolationModal<
  Arg extends { isOpen?: boolean; onClose?: () => void },
>(Modal: (props: Arg) => ReactNode) {
  const [context, setContext] = useState<ReactNode>()
  const propsOnCloseRef = useRef(() => {})
  const onClose = useMemoizedFn(() => {
    propsOnCloseRef.current()
    setContext(undefined)
  })

  const openModal = useMemoizedFn((props?: PartialIncludes<Arg, 'onClose'>) => {
    // const container = document.createDocumentFragment()
    // const root = createRoot(container)
    propsOnCloseRef.current = props?.onClose ?? (() => {})
    setContext(<Modal {...(props as Arg)} isOpen={true} onClose={onClose} />)
  })

  return [{ openModal, closeModal: onClose }, context] as const
}

export function createIsolationModal<T extends Record<string, any>>(
  child: (
    props: {
      isOpen: boolean
      /**关闭modal，可保留组件的动画 */
      onClose: () => void
      /**彻底关闭modal，在onClose使用后再用该方法。如果直接使用该方法，会导致没有关闭动画 */
      destroy: () => void
    } & T,
  ) => ReactNode,
) {
  return function isolatedModal(
    props: { isOpen?: boolean; onClose?: () => void } & T,
  ) {
    const [isOpen, setOpen] = useState(true)

    useEffect(() => {
      if (isUndefined(props.isOpen)) return
      setOpen(props.isOpen)
    }, [props.isOpen])
    const handleClose = useMemoizedFn(() => {
      setOpen(false)
    })
    const afterOpenChange = useMemoizedFn(() => {
      props.onClose?.()
      setOpen(false)
    })

    return child({
      ...props,
      isOpen,
      onClose: handleClose,
      destroy: afterOpenChange,
    })
  }
}
