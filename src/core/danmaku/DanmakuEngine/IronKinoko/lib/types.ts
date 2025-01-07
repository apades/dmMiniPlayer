type RequiredPick<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
type PartialPick<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Stage = HTMLDivElement & { width: number; height: number }

export type Mode = 'ltr' | 'rtl' | 'top' | 'bottom'
export interface Comment {
  text?: string
  mode?: Mode
  /**
   * Specified in seconds. Not required in live mode.
   * @default media?.currentTime
   */
  time: number
  style?: Partial<CSSStyleDeclaration>
  /**
   * A custom render to draw comment.
   * When it exist, `text` and `style` will be ignored.
   */
  render?(): HTMLElement
}

export type RunningState = {
  node: HTMLDivElement
  width: number
  height: number
  y: number
  _: {
    duration: number
    fullDuration: number
    // translateX end position
    end: number
    // 起始偏移时间
    currentTime: number
    // 剩余总长
    leftWidth: number
    // 全长
    fullWidth: number
  }
}
export type EmitCommet = PartialPick<Comment, 'time'>
export type InnerComment = RequiredPick<Comment, 'mode'>
export type RunningComment = InnerComment & RunningState
export type RunningCommentRange = RunningComment & { range: number }

export interface DanmakuOption {
  /**
   * The stage to display comments will be appended to container.
   */
  container: HTMLElement
  /**
   * If it's not provided, Danmaku will be in live mode.
   */
  media?: HTMLMediaElement
  /**
   * Preseted comments, used in media mode
   */
  comments?: Comment[]
  /**
   * The speed of comments in `ltr` and `rtl` mode.
   */
  speed?: number
  /**
   * The opacity of comments.
   */
  opacity?: number
  /**
   * Merge same comments
   *
   * @default false
   */
  merge?: boolean
  /**
   * Allow comments to overlap
   *
   * @default false
   */
  overlap?: boolean
  /**
   * rlt or ltr comment scroll area height percent of stage height 0~1
   *
   * @default 1
   */
  scrollAreaPercent?: number
}

export interface InnerState {
  listener: any
  space: { [x in Mode]: RunningCommentRange[] }
  visible: boolean
  requestID: number
  speed: number
  duration: number
  engine: any
  rafIds: Set<number>
  runningList: RunningComment[]
  position: number
  paused: boolean
  opacity: number
  stage: Stage
  merge: boolean
  overlap: boolean
  scrollAreaPercent: number
  get currentTime(): number
}
