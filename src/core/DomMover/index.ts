export default class DomMover {
  styleEls: HTMLStyleElement[]
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
  }
  protected async requestPIP() {}
  openPIP(el: HTMLElement) {}
}
