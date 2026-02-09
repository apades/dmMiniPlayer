import configStore from '@root/store/config'
import config_shortcut, {
  disableRender,
  formatKeys,
} from '@root/store/config/shortcut'
import { Key, keyCodeToCode, keyToKeyCodeMap, KeyType } from '@root/types/key'
import { autorun } from 'mobx'
import { addEventListener } from '@root/utils'
import { eventBus } from './event'

// const getShortcutConfigs = onceCall(() =>
//   Object.fromEntries(
//     Object.entries(configStore)
//       .map(([key, val]) =>
//         key.startsWith('shortcut_') ? [key, val] : undefined,
//       )
//       .filter((v) => !!v),
//   ),
// )

export const getShortcutConfigs = () => {
  const keys = Object.entries(config_shortcut)
    .filter(
      ([key, val]) =>
        (val as any).render !== disableRender && key !== 'shortcut_desc',
    )
    .map(([key]) => key)

  return Object.fromEntries(
    keys.map((key) => [key, (configStore as any)[key]]),
  ) as Pick<typeof configStore, keyof typeof config_shortcut>
}

export const getShortcutAllConfigs = () => {
  const keys = Object.entries(config_shortcut).map(([key]) => key)

  return Object.fromEntries(
    keys.map((key) => [key, (configStore as any)[key]]),
  ) as Pick<typeof configStore, keyof typeof config_shortcut>
}

export class KeyBinding {
  keydownWindow: Window = window

  constructor() {}

  protected configKeyMap: Record<string, () => void> = {}
  protected pressingKeyMap: Record<string, number> = {}
  protected releasePressingKeyFnMap: Record<string, () => void> = {}

  protected unListens: (() => void)[] = []
  protected onKeydownFns = new Set<(e: KeyboardEvent) => void>()
  protected onKeyupFns = new Set<(e: KeyboardEvent) => void>()

  protected pressingConstant = 3

  updateKeydownWindow(keydownWindow: Window) {
    this.unload()

    this.keydownWindow = keydownWindow
    this.init()
  }

  init() {
    this.unload()
    this.unListens.push(
      addEventListener(this.keydownWindow, (keydownWindow) => {
        keydownWindow.addEventListener('keydown', (e) => {
          this.handleKeyDown(e)
        })
        keydownWindow.addEventListener('dm-keydown' as any, (e) => {
          this.handleCustomKeyDown(e)
        })
        keydownWindow.addEventListener('keyup', (e) => {
          this.handleKeyUp(e)
        })
        keydownWindow.addEventListener('dm-keyup' as any, (e) => {
          this.handleCustomKeyUp(e)
        })
      }),
    )

    this.unListens.push(
      autorun(() => {
        this.configKeyMap = {}
        const configs = getShortcutConfigs()
        Object.entries(configs).forEach(([name, _keys]) => {
          const keys = _keys as Key[]
          const key = (keys as string[]).join('+')

          this.configKeyMap[key] = () => {
            const command = name.replace('shortcut_', 'command_') as any
            console.log('command', command)
            eventBus.emit(command)
          }

          if (keys[keys.length - 1] === KeyType.press) {
            this.configKeyMap[`${key}_release`] = () => {
              const command = name.replace('shortcut_', 'command_') as any
              console.log('command', `${command}_release`)
              eventBus.emit(`${command}_release` as any)
            }
          }
        })

        console.log('configKeyMap', this.configKeyMap)
      }),
    )
  }

  unload() {
    this.unListens.forEach((fn) => fn())
    this.unListens.length = 0
  }

  protected handleKeyDown(e: KeyboardEvent) {
    const tar = e.target as HTMLElement
    if (
      tar.tagName === 'TEXTAREA' ||
      tar.tagName === 'INPUT' ||
      tar.contentEditable === 'true'
    )
      return
    // e.stopPropagation()

    const { keyCode, shiftKey, ctrlKey, altKey } = e
    // if (key.length === 1) key = key.toLowerCase()
    const actions: Key[] = []

    if (shiftKey && keyCode !== keyToKeyCodeMap.Shift) actions.push('Shift')
    if (ctrlKey && keyCode !== keyToKeyCodeMap.Ctrl) actions.push('Ctrl')
    if (altKey && keyCode !== keyToKeyCodeMap.Alt) actions.push('Alt')

    actions.push(...formatKeys((keyCodeToCode as any)[keyCode]))

    const mapKey = actions.join('+')

    // pressing
    if (
      this.pressingKeyMap[mapKey] >= this.pressingConstant &&
      this.configKeyMap[`${mapKey}+${KeyType.press}`]
    ) {
      // e.preventDefault()
      const fn = this.configKeyMap[`${mapKey}+${KeyType.press}`]
      fn()
      this.releasePressingKeyFnMap[mapKey] = () => {
        this.configKeyMap[`${mapKey}+${KeyType.press}`] = fn
        this.configKeyMap[`${mapKey}+${KeyType.press}_release`]?.()
      }
      delete this.configKeyMap[`${mapKey}+${KeyType.press}`]
    }
    // +keydown
    else if (this.configKeyMap[`${mapKey}+${KeyType.keydown}`]) {
      // e.preventDefault()
      this.configKeyMap[`${mapKey}+${KeyType.keydown}`]()
    }
    // +keydown default 格式
    else if (this.configKeyMap[mapKey]) {
      // e.preventDefault()
      this.configKeyMap[mapKey]()
    } else {
      this.onKeydownFns.forEach((fn) => fn(e))
    }

    this.pressingKeyMap[mapKey] ??= 0
    this.pressingKeyMap[mapKey]++
  }
  protected handleKeyUp(e: KeyboardEvent) {
    const tar = e.target as HTMLElement
    if (
      tar.tagName === 'TEXTAREA' ||
      tar.tagName === 'INPUT' ||
      tar.contentEditable === 'true'
    )
      return
    // e.stopPropagation()

    const { keyCode, shiftKey, ctrlKey } = e
    // if (key.length === 1) key = key.toLowerCase()
    const actions: Key[] = []

    if (shiftKey && keyCode !== keyToKeyCodeMap.Shift) actions.push('Shift')
    if (ctrlKey && keyCode !== keyToKeyCodeMap.Ctrl) actions.push('Ctrl')

    actions.push(...formatKeys((keyCodeToCode as any)[keyCode]))

    const mapKey = actions.join('+')

    if (this.releasePressingKeyFnMap[mapKey]) {
      this.releasePressingKeyFnMap[mapKey]()
      delete this.releasePressingKeyFnMap[mapKey]
    }

    if (
      this.configKeyMap[`${mapKey}+${KeyType.keyup}`] &&
      this.pressingKeyMap[mapKey] < this.pressingConstant
    ) {
      // e.preventDefault()
      this.configKeyMap[`${mapKey}+${KeyType.keyup}`]()
    } else {
      this.onKeyupFns.forEach((fn) => fn(e))
    }

    delete this.pressingKeyMap[mapKey]
  }
  // 这是给replacer模式监听的，keydown keyup已经被阻止了，通过一层代理转发和监听
  protected handleCustomKeyDown(e: KeyboardEvent) {
    const detail = e.detail
    this.handleKeyDown.bind(this)(detail as any)
  }
  protected handleCustomKeyUp(e: KeyboardEvent) {
    const detail = e.detail
    this.handleKeyUp.bind(this)(detail as any)
  }

  onKeydown(fn: (e: KeyboardEvent) => void) {
    this.onKeydownFns.add(fn)
    return () => {
      this.onKeydownFns.delete(fn)
    }
  }
  onKeyup(fn: (e: KeyboardEvent) => void) {
    this.onKeyupFns.add(fn)
    return () => {
      this.onKeyupFns.delete(fn)
    }
  }
}
