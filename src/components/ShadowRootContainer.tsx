import { useOnce } from '@root/hook'
import isDev from '@root/shared/isDev'
import { createElement, wait, waitLoopCallback } from '@root/utils'
import { FC, PropsWithChildren, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'

const ShadowRootContainer: FC<PropsWithChildren> = (props) => {
  const rootRef = useRef<HTMLDivElement>(null)

  const shadowRoot = useMemo(() => {
    const root = document.createElement('div')
    root.attachShadow({ mode: 'open' })
    if (isDev) {
      import('../style/tailwind.css?inline').then((data) => {
        root.shadowRoot!.append(
          createElement('style', {
            innerHTML: data.default,
          }),
        )
      })
      import('../style/tailwindBase.css?inline').then((data) => {
        root.shadowRoot!.append(
          createElement('style', {
            innerHTML: data.default,
          }),
        )
      })
    } else {
      root.shadowRoot!.append(
        createElement('link', {
          rel: 'stylesheet',
          href: Browser.runtime.getURL('/css.css'),
          onload: async (e) => {
            const target = e.target as HTMLLinkElement
            await waitLoopCallback(() => !!target.sheet, { intervalTime: 10 })
            await wait(10)
            if (!rootRef.current) return
            rootRef.current.style.visibility = ''
          },
        }),
      )
    }
    return root
  }, [])

  useOnce(() => {
    if (!rootRef.current) return
    rootRef.current.appendChild(shadowRoot)
  })

  return (
    <div ref={rootRef} style={{ all: 'initial', visibility: 'hidden' }}>
      {createPortal(props.children, shadowRoot.shadowRoot!)}
    </div>
  )
}

export default ShadowRootContainer
