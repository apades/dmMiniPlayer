import { wait } from '.'
import { dqParents } from './dom'

export function observeVideoEl(
  videoEl: HTMLVideoElement,
  onChange: (videoEl: HTMLVideoElement) => void
) {
  console.log('observeVideoEl', videoEl)
  let t = 0,
    timer: NodeJS.Timeout
  function observe(videoEl: HTMLElement) {
    return new Promise<HTMLElement>((res) => {
      const parents = dqParents(videoEl, '*').reverse()
      if (parents[0].tagName !== 'HTML')
        throw Error('该videoEl已经不在html上了')

      // let removeIndex = -1
      const disconnects = parents.map((el, i) => {
        const child = parents[i + 1] || videoEl
        const observer = new MutationObserver((list, observer) => {
          if (child == videoEl) {
            let addVideoNode: HTMLElement
            list.find((l) => {
              return [...l.addedNodes].find((n: HTMLElement) => {
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
      const newParent = await observe(videoEl)
      t++
      clearTimeout(timer)
      timer = setTimeout(() => {
        t = 0
      }, 1000)
      if (t == 3) throw Error('短时间内videoEl刷新次数过多，紧急停止监听守护')
      await wait()
      console.log('newParent', newParent)
      videoEl = newParent.querySelector('video')
      if (!videoEl) throw Error('无法找到新的videoEl')
      onChange(videoEl)
    }
  })()

  return () => {
    stop = true
    _disconnects.forEach((fn) => fn())
  }
}
