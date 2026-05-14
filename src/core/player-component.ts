import type { DanmakuEngine } from './danmaku/DanmakuEngine'
import type DanmakuSender from './danmaku/DanmakuSender'
import type { SideSwitcher } from './SideSwitcher'
import type SubtitleManager from './SubtitleManager'
import type VideoPreviewManager from './VideoPreviewManager'

export type PlayerComponent<Component, Key = keyof Component> = {
  readonly __playerComponentKey__: Key
}

type PlayerComponentMethodKey<T extends PlayerComponent<any, any>> =
  T['__playerComponentKey__']

type FunctionPropertyKey<T> = {
  [Key in keyof T]-?: T[Key] extends (...args: any[]) => any ? Key : never
}[keyof T]

type PlayerComponentMethodResolver<
  T extends PlayerComponent<any, any>,
  Method extends keyof T,
> = T[Method] extends (...args: infer Args) => infer Return
  ? (this: T, ...args: Args) => Return
  : never

export type PlayerComponentConfigResolver<
  T extends Record<string, PlayerComponent<any, any>>,
> = {
  [Name in keyof T]: {
    [Method in Extract<
      PlayerComponentMethodKey<T[Name]>,
      FunctionPropertyKey<T[Name]>
    >]-?: PlayerComponentMethodResolver<T[Name], Method>
  } & {
    [Method in Exclude<
      FunctionPropertyKey<T[Name]>,
      PlayerComponentMethodKey<T[Name]>
    >]?: PlayerComponentMethodResolver<T[Name], Method>
  }
}

export type PlayerComponents = {
  DanmakuEngine: DanmakuEngine
  DanmakuSender: DanmakuSender
  SideSwitcher: SideSwitcher
  VideoPreviewManager: VideoPreviewManager
  SubtitleManager: SubtitleManager
}

export type PlayerComponentsConfig = Partial<
  PlayerComponentConfigResolver<PlayerComponents>
>
