import { useOnce } from '@root/hook'
import { appRootContext } from '@root/hook/useAppRootEl'
import isDev from '@root/shared/isDev'
import { createElement, wait, waitLoopCallback } from '@root/utils'
import { useUnmount, useUpdate } from 'ahooks'
import {
  CSSProperties,
  FC,
  PropsWithChildren,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import Browser from 'webextension-polyfill'

let _id = 0
type Props = {
  isShadowRoot?: boolean
  isFloatBtn?: boolean
} & PropsWithChildren
const AppRoot: FC<Props> = (props) => {
  const [id] = useState(() => _id++)
  useUnmount(() => _id--)

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
            containerRef.current.style.removeProperty('visibility')
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
    <appRootContext.Provider value={{ rootRef: containerRef }}>
      <div
        id={`app-root-${id}`}
        ref={containerRef}
        style={{
          all: 'initial',
          visibility: isDev ? undefined : 'hidden',
        }}
      >
        {root instanceof ShadowRoot
          ? createPortal(props.children, root)
          : props.children}
      </div>
      {props.isFloatBtn && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
        #app-root-${id} {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
      `,
          }}
        ></style>
      )}
    </appRootContext.Provider>
  )
}

export default AppRoot
