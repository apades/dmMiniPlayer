/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { dqParents } from './dom'
import { wait } from '.'

export function observeVideoEl(
  videoEl: HTMLVideoElement,
  onChange: (videoEl: HTMLVideoElement) => void,
) {
  let t = 0,
    timer: NodeJS.Timeout
  function observe(videoEl: HTMLElement) {
    return new Promise<HTMLElement>((res) => {
      const parents = dqParents(videoEl, '*').reverse()
      if (parents[0] && parents[0].tagName !== 'HTML')
        throw Error('该videoEl已经不在html上了')

      // let removeIndex = -1
      const disconnects = parents.map((el, i) => {
        const child = parents[i + 1] || videoEl
        const observer = new MutationObserver((list, observer) => {
          if (child == videoEl) {
            let addVideoNode: HTMLElement | null = null
            list.find((l) => {
              return [...l.addedNodes].find((n) => {
                if (!(n instanceof HTMLElement)) return
                if (n?.tagName == 'VIDEO') {
                  addVideoNode = n
                  return true
                }
              })
            })
            if (addVideoNode) {
              console.log('增加了新的video标签', addVideoNode, el)
              res(el)
            }
            return
          } else if (
            list.find((l) => {
              return [...l.removedNodes].includes(child)
            })
          ) {
            //   removeIndex = i
            console.log('parent被移除了', child, el)
            disconnects.forEach((fn) => fn())
            res(el)
          }
        })

        observer.observe(el, { childList: true })

        return () => observer.disconnect()
      })
      _disconnects = disconnects
    })
  }

  let _disconnects: Function[] = []
  let stop = false

  ;(async () => {
    while (!stop) {
      _disconnects.forEach((fn) => fn())
      const newParent = await observe(videoEl)
      t++
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      clearTimeout(timer)
      timer = setTimeout(() => {
        t = 0
      }, 5000)
      if (t == 3) throw Error('短时间内videoEl刷新次数过多，紧急停止监听守护')
      await wait()
      console.log('newParent', newParent)
      videoEl = newParent.querySelector('video')!
      if (!videoEl) throw Error('无法找到新的videoEl')
      onChange(videoEl)
    }
  })()

  return () => {
    stop = true
    _disconnects.forEach((fn) => fn())
  }
}
