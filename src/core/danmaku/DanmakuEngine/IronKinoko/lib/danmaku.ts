import domEngine from './engine/dom'
import { bindEvents, unbindEvents } from './internal/events'
import pause from './internal/pause'
import play from './internal/play'
import seek from './internal/seek'
import type {
  InnerComment,
  DanmakuOption,
  InnerState,
  Comment,
  EmitCommet,
} from './types'
import {
  bindEngine,
  binsearch,
  caf,
  clamp,
  raf,
  resetSpace,
  transComment,
} from './utils'

export default class Danmaku {
  container: HTMLElement
  media?: HTMLMediaElement
  comments: InnerComment[]
  protected _: InnerState
  constructor(opt: DanmakuOption) {
    if (!opt.container) throw new Error('container required')

    this._ = {
      visible: true,
      requestID: 0,
      duration: 4,
      engine: bindEngine.call(this, domEngine),
      rafIds: new Set(),
      runningList: [],
      position: 0,
      paused: true,
      opacity: opt.opacity ?? 1,
      overlap: opt.overlap ?? false,
      merge: opt.merge ?? false,
      scrollAreaPercent: clamp(0.25, opt.scrollAreaPercent || 1, 1),
      speed: opt.speed ? Math.max(0, opt.speed) : 144,
    } as any
    this.container = opt.container
    this.media = opt.media
    this.comments = transComment(opt.comments)

    Object.defineProperty(this._, 'currentTime', {
      get: () => {
        return this.media ? this.media.currentTime : Date.now() / 1000
      },
    })

    if (this.media) {
      this._.listener = {}
      bindEvents.call(this, this._.listener)
    }

    this._.stage = this._.engine.init(this.container)
    this._.stage.style.opacity = this._.opacity + ''

    this.resize()
    this.container.appendChild(this._.stage)

    this._.space = resetSpace({})

    if (!this.media || !this.media.paused) {
      seek.call(this)
      play.call(this)
    }
  }

  get scrollAreaPercent() {
    return this._.scrollAreaPercent
  }
  set scrollAreaPercent(v) {
    this._.scrollAreaPercent = clamp(0.25, v || 1, 1)
    seek.call(this)
  }

  get overlap() {
    return this._.overlap
  }
  set overlap(v) {
    this._.overlap = v
    seek.call(this)
  }

  get merge() {
    return this._.merge
  }
  set merge(v) {
    this._.merge = v
    seek.call(this)
  }

  get stage() {
    return this._.stage
  }

  get speed() {
    return this._.speed
  }
  set speed(s) {
    if (typeof s !== 'number' || isNaN(s) || !isFinite(s) || s <= 0) return
    this._.speed = s
    if (this._.stage.width) {
      this._.duration = this._.stage.width / s
    }
    this.refresh()
  }

  get opacity() {
    return this._.opacity
  }
  set opacity(s) {
    if (typeof s !== 'number' || isNaN(s)) return
    s = Math.min(Math.max(s, 0), 1)
    this._.opacity = s
    this._.stage.style.opacity = s + ''
  }

  show() {
    if (this._.visible) {
      return this
    }
    this._.visible = true
    if (this.media && this.media.paused) {
      return this
    }
    seek.call(this)
    play.call(this)
    return this
  }

  resize(size?: { width: number, height: number }) {
    this._.stage.width = size?.width ?? this.container.offsetWidth
    this._.stage.height = size?.height ?? this.container.offsetHeight
    this._.engine.resize(this._.stage)
    this._.duration = this._.stage.width / this._.speed
    this.refresh()
    return this
  }

  reload(comments: Comment[]) {
    this.clear()
    this.comments = transComment(comments)

    seek.call(this)
    return this
  }

  refresh() {
    if (!this._.visible || this._.paused) {
      return this
    }

    this._.engine.pause({
      stage: this._.stage,
      comments: this._.runningList,
      currentTime: this._.currentTime,
    })
    this._.rafIds.forEach(caf)
    this._.rafIds.clear()

    raf(() => {
      this._.engine.play({
        stage: this._.stage,
        comments: this._.runningList,
        playbackRate: this.media ? this.media.playbackRate : 1,
        currentTime: this._.currentTime,
        duration: this._.duration,
        rafIds: this._.rafIds,
      })
    })
    return this
  }

  hide() {
    if (!this._.visible) {
      return this
    }
    pause.call(this)
    this.clear()
    this._.visible = false
    return this
  }

  emit(comment: EmitCommet) {
    const cmt: InnerComment = Object.assign({ mode: 'rtl', time: 0 }, comment)
    if (this.media) {
      let position = 0
      if (cmt.time === undefined) {
        cmt.time = this.media.currentTime
        position = this._.position
      } else {
        position = binsearch(this.comments, 'time', cmt.time)
        if (position < this._.position) {
          this._.position += 1
        }
      }
      this.comments.splice(position, 0, cmt)
    } else {
      cmt.time = Date.now() / 1000
      this.comments.push(cmt)
    }
    return this
  }

  destroy() {
    pause.call(this)
    this.clear()
    this._.stage.parentElement?.removeChild(this._.stage)

    if (this.media) {
      unbindEvents.call(this, this._.listener)
    }
    return this
  }

  clear() {
    this._.engine.clear(this._.stage, this._.runningList)
    this._.runningList = []
    return this
  }
}
