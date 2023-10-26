import configStore from '@root/store/config'

export default class DomMover {
  styleEls: HTMLStyleElement[]
  docWindow: Window
  originParent: HTMLElement
  originInParentIndex: number
  pipEl: HTMLElement
  constructor() {}

  protected copyWebStyles() {
    this.styleEls = [...document.styleSheets].map((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules]
          .map((rule) => rule.cssText)
          .join('')
        const style = document.createElement('style')

        style.textContent = cssRules
        return style
      } catch (e) {
        const link = document.createElement('link')

        link.rel = 'stylesheet'
        link.type = styleSheet.type
        link.media = styleSheet.media as any
        link.href = styleSheet.href
        return link
      }
    })
    return this.styleEls
  }
  protected cloneParentContainer(el: HTMLElement) {
    function clone(container: HTMLElement) {
      const p = container.parentElement
      if (p == document.body) return container
      const containerParent = p.cloneNode()
      containerParent.appendChild(container)
    }
    return clone(el.parentElement)
  }

  protected async requestPIP() {
    this.docWindow = await window.documentPictureInPicture.requestWindow()
    return this.docWindow
  }
  async openPIP(el: HTMLElement) {
    if (this.docWindow) return
    const docWindow = await this.requestPIP()

    const styleEls = this.copyWebStyles()
    this.pipEl = el
    this.originParent = el.parentElement
    this.originInParentIndex = [...el.parentElement.children].findIndex(
      (child) => child == el
    )
    if (configStore.domMover_copyParents) {
      const parentContainer = this.cloneParentContainer(el)
      parentContainer.appendChild(el)
      docWindow.document.body.appendChild(parentContainer)
    } else {
      docWindow.document.body.appendChild(el)
    }

    styleEls.forEach((el) => {
      docWindow.document.head.appendChild(el)
    })

    docWindow.addEventListener('pagehide', () => {
      this.restorePIPEl()
    })
  }

  restorePIPEl() {
    const originParent = this.originParent,
      originInParentIndex = this.originInParentIndex,
      el = this.pipEl
    if (!originParent.childNodes[originInParentIndex]) {
      originParent.appendChild(el)
    } else {
      originParent.insertBefore(
        el,
        originParent.childNodes[originInParentIndex]
      )
    }
    this.clearAllState()
  }

  protected clearAllState() {
    this.docWindow = null
    this.pipEl = null
    this.originParent = null
    this.originInParentIndex = null
  }
}
