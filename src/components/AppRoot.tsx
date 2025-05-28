import { useOnce } from '@root/hook'
import isDev from '@root/shared/isDev'
import { createElement, wait, waitLoopCallback } from '@root/utils'
import { useUpdate } from 'ahooks'
import { type FC, type PropsWithChildren, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'

type Props = {
  isShadowRoot?: boolean
} & PropsWithChildren
const AppRoot: FC<Props> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const root = useMemo(() => {
    const root = (() => {
      const root = document.createElement('div')
      if (!props.isShadowRoot) return root
      root.attachShadow({ mode: 'open' })
      return root.shadowRoot!
    })()

    if (!root) return null

    if (isDev) {
      import('../style/index.css?inline').then((data) => {
        root.append(
          createElement('style', {
            innerHTML: data.default,
          }),
        )
      })
    } else {
      root.append(
        createElement('link', {
          rel: 'stylesheet',
          href: Browser.runtime.getURL('/css.css'),
          onload: async (e) => {
            const target = e.target as HTMLLinkElement
            await waitLoopCallback(() => !!target.sheet, { intervalTime: 10 })
            await wait(10)
            if (!containerRef.current) return
            containerRef.current.style.visibility = ''
          },
        }),
      )
    }
    return root
  }, [])

  useOnce(() => {
    if (!containerRef.current) return
    containerRef.current.appendChild(
      root instanceof ShadowRoot ? root.host : root!,
    )
  })

  return (
    <div
      ref={containerRef}
      style={{ all: 'initial', visibility: isDev ? undefined : 'hidden' }}
    >
      {root instanceof ShadowRoot
        ? createPortal(props.children, root)
        : props.children}
    </div>
  )
}

export default AppRoot
