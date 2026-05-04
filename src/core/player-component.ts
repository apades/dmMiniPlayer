import type { DanmakuEngine } from './danmaku/DanmakuEngine'
import type DanmakuSender from './danmaku/DanmakuSender'
import type { SideSwitcher } from './SideSwitcher'

export type PlayerComponent<Component, Key = keyof Component> = {
  readonly __playerComponentKey__: Key
}

type PlayerComponentMethodKey<T extends PlayerComponent<any, any>> =
  T['__playerComponentKey__']

export type PlayerComponentConfigResolver<
  T extends Record<string, PlayerComponent<any, any>>,
> = {
  [Name in keyof T]: {
    [Method in PlayerComponentMethodKey<T[Name]>]: (
      this: T[Name],
      ...args: Parameters<T[Name][Method]>
    ) => ReturnType<T[Name][Method]>
  }
}

export type PlayerComponents = {
  DanmakuEngine: DanmakuEngine
  DanmakuSender: DanmakuSender
  SideSwitcher: SideSwitcher
}

export type PlayerComponentsConfig = Partial<
  PlayerComponentConfigResolver<PlayerComponents>
>
