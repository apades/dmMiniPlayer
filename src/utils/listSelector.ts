import { getTopParentsWithSameRect } from './dom'
import { createElement, throttle } from '.'

export function listSelector() {
  return new Promise<{ parent: HTMLElement; childs: HTMLElement[] }>((res) => {
    const styleEl = createElement('style', {
      innerText: `.list-h-select{ background-color: red; }`,
    })
    let lastEls: HTMLElement[] = []
    const handleMousemove = throttle((e: MouseEvent) => {
      const target = e.target as HTMLElement
      const topElements = getTopParentsWithSameRect(target)
      const topEl = topElements[topElements.length - 1] || target
      // console.log('topEl', topEl)
      lastEls.forEach((el) => el.classList.remove('list-h-select'))
      if (topEl.parentElement) {
        const childs = Array.from(topEl.parentElement.children) as HTMLElement[]
        const sameEls = childs.filter((child) => {
          if (child == topEl) return true
          return isSameEl(topEl, child)
        })

        sameEls.forEach((el) => el.classList.add('list-h-select'))
        lastEls = sameEls
      }
    }, 200)
    document.body.appendChild(styleEl)

    window.addEventListener('mousemove', handleMousemove)

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      window.removeEventListener('click', handleClick, false)
      window.removeEventListener('mousemove', handleMousemove)
      lastEls.forEach((el) => el.classList.remove('list-h-select'))
      try {
        document.body.removeChild(styleEl)
      } catch (error) {
        // ...
      }

      res({ parent: lastEls[0].parentElement, childs: lastEls })
    }
    window.addEventListener('click', handleClick, true)
  })
}

function isSameEl(el: HTMLElement, tar: HTMLElement) {
  const elClassUnEqual = [...el.classList.values()].find((cls) => {
    if (cls == 'list-h-select') return false
    return !tar.classList.contains(cls)
  })

  return !elClassUnEqual && el.tagName == tar.tagName
}
