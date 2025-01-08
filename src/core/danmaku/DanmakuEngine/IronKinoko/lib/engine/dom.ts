import Danmaku from '../danmaku'
import type { InnerComment, RunningComment, Stage } from '../types'
import { raf } from '../utils'

function createCommentNode(cmt: InnerComment) {
  const node = document.createElement('div')
  node.style.cssText = 'position:absolute;'
  if (typeof cmt.render === 'function') {
    const $el = cmt.render()
    if ($el instanceof HTMLElement) {
      node.appendChild($el)
      return node
    }
  }
  if (cmt.mode === 'top' || cmt.mode === 'bottom') {
    node.style.left = '50%'
    node.style.transform = 'translateX(-50%)'
  }
  node.style.willChange = 'transform, opacity'
  node.className = 'danmaku'

  node.textContent = cmt.text || ''
  if (cmt.style) {
    Object.assign(node.style, cmt.style)
  }
  return node
}

function init() {
  const stage = document.createElement('div')
  stage.classList.add('danmaku-stage')
  stage.style.cssText =
    'overflow:hidden;white-space:nowrap;transform:translateZ(0);position:relative;pointer-events:none;'
  return stage
}

function clear(stage: Stage) {
  let lc = stage.lastChild
  while (lc) {
    stage.removeChild(lc)
    lc = stage.lastChild
  }
}

function resize(stage: Stage) {
  stage.style.width = stage.width + 'px'
  stage.style.height = stage.height + 'px'
}

function setup(this: Danmaku, stage: Stage, comments: InnerComment[]) {
  const df = document.createDocumentFragment()
  const pendingComments = comments.reduce<RunningComment[]>((arr, cmt) => {
    let isMerged = false
    if (this._.merge) {
      const firstCmt = [...this._.runningList, ...arr].find((runningCmt) => {
        if (cmt.render) return false
        return runningCmt.text === cmt.text && runningCmt.mode === cmt.mode
      })
      if (firstCmt) {
        isMerged = true
        firstCmt.node.dataset.count =
          parseInt(firstCmt.node.dataset.count || '1') + 1 + ''

        firstCmt.node.textContent = `(${firstCmt.node.dataset.count})${firstCmt.text}`
      }
    }

    if (!isMerged) {
      const node = createCommentNode(cmt)
      df.appendChild(node)
      arr.push({ ...cmt, node } as RunningComment)
    }

    return arr
  }, [])

  if (pendingComments.length) {
    stage.appendChild(df)
  }

  const currentTime = this._.currentTime
  const duration = this._.duration

  pendingComments.forEach((cmt) => {
    cmt.width = cmt.width || cmt.node.offsetWidth
    cmt.height = cmt.height || cmt.node.offsetHeight

    if (cmt.mode === 'top' || cmt.mode === 'bottom') {
      cmt._ = {
        // 剩余时长
        duration: duration - (currentTime - cmt.time),
        // 全部时长
        fullDuration: this._.duration,
      } as any
    } else if (cmt.mode === 'rtl' || cmt.mode === 'ltr') {
      const isRTL = cmt.mode === 'rtl'
      const fullWidth = cmt.width + stage.width
      const offset = ((currentTime - cmt.time) / duration) * fullWidth
      const start = isRTL ? stage.width - offset : offset - cmt.width
      const end = isRTL ? -cmt.width : stage.width

      if (isRTL) cmt.node.style.left = start + 'px'
      else cmt.node.style.right = end - offset + 'px'

      cmt._ = {
        // 剩余时长
        duration: duration - (currentTime - cmt.time),
        // 全部时长
        fullDuration: this._.duration,
        // 偏移量
        end: end - start,
        // 起始偏移时间
        currentTime: currentTime,
        // 剩余总长
        leftWidth: Math.abs(fullWidth - offset),
        // 全长
        fullWidth: fullWidth,
      }
    }
  })
  return pendingComments
}

function render(
  this: Danmaku,
  { cmt, playbackRate }: { cmt: RunningComment; playbackRate: number },
) {
  if (cmt.mode === 'rtl' || cmt.mode === 'ltr') {
    cmt.node.style.top = cmt.y + 'px'

    cmt.node.style.transform = `translateX(0)`
    const rafId = raf(() => {
      cmt.node.style.transform = `translateX(${cmt._.end}px)`
      cmt.node.style.transition = `transform ${
        cmt._.duration / playbackRate
      }s linear`
      this._.rafIds.delete(rafId)
    })
    this._.rafIds.add(rafId)
  } else if (cmt.mode === 'top') {
    cmt.node.style.top = cmt.y + 'px'
  } else if (cmt.mode === 'bottom') {
    cmt.node.style.bottom = cmt.y + 'px'
  }
}

function remove(this: Danmaku, stage: Stage, cmt: RunningComment) {
  stage.removeChild(cmt.node)
}

function pause({
  comments,
  currentTime,
}: {
  comments: RunningComment[]
  currentTime: number
}) {
  comments.forEach((cmt) => {
    if (cmt.mode === 'rtl' || cmt.mode === 'ltr') {
      const isRTL = cmt.mode === 'rtl'

      const offset =
        ((currentTime - cmt._.currentTime) / cmt._.duration) * cmt._.leftWidth

      cmt.node.style.transition = ''
      cmt.node.style.transform = `translateX(${isRTL ? '-' : ''}${offset}px)`
      cmt.node.style.animationPlayState = 'paused'
    }
  })
}

function play({
  comments,
  playbackRate,
  currentTime,
}: {
  comments: RunningComment[]
  playbackRate: number
  currentTime: number
}) {
  comments.forEach((cmt) => {
    if (cmt.mode === 'rtl' || cmt.mode === 'ltr') {
      cmt.node.style.animationPlayState = ''
      cmt.node.style.transform = `translateX(${cmt._.end}px)`
      cmt.node.style.transition = `transform ${
        (cmt._.duration - (currentTime - cmt._.currentTime)) / playbackRate
      }s linear`
    }
  })
}

export default {
  name: 'dom',
  init: init,
  clear: clear,
  resize: resize,
  setup: setup,
  render: render,
  remove: remove,
  pause: pause,
  play: play,
}
