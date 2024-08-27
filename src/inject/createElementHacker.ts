import { getPrototypeSetter, getPrototypeGetter } from '@root/utils'

const ENABLE_SITES = ['https://www.youtube.com']

function log(...args: any) {
  // console?.log('🐛', ...args)
}
function errorLog(...args: any) {
  console?.error('😰', ...args)
}

function injectCreateElement() {
  const originCreateElement = document.createElement

  console.log('💀 inject createElement')

  const createElement: typeof originCreateElement = (
    tag: string,
    options: any
  ) => {
    const dom = originCreateElement.call(document, tag, options)

    if (tag.toLowerCase() === 'iframe') {
      log('create iframe element', dom)
      const iframeEl = dom as HTMLIFrameElement

      try {
        const srcGetter = getPrototypeGetter(iframeEl, 'contentWindow')

        if (srcGetter) {
          Object.defineProperty(iframeEl, 'contentWindow', {
            get() {
              const contentWindow = srcGetter.call(iframeEl) as Window
              contentWindow.history.pushState = window.history.pushState
              contentWindow.history.replaceState = window.history.replaceState
              contentWindow.history.forward = window.history.forward

              contentWindow.History.prototype.pushState = history.pushState
              contentWindow.History.prototype.replaceState =
                history.replaceState
              contentWindow.History.prototype.forward = history.forward
              // console.log('someone get contentWindow', iframeEl)
              return contentWindow
            },
          })
        } else {
          errorLog('can get iframe src getter')
        }
      } catch (error) {
        errorLog('binding [contentWindow] getter running error', error)
      }

      return iframeEl
    }

    return dom
  }

  document.createElement = createElement
}

if (ENABLE_SITES.includes(window.location.origin)) {
  injectCreateElement()
}
