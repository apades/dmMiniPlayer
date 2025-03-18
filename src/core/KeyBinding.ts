import configStore from '@root/store/config'
import config_shortcut, {
  disableRender,
  formatKeys,
} from '@root/store/config/shortcut'
import { Key, keyCodeToCode, keyToKeyCodeMap } from '@root/types/key'
import { autorun } from 'mobx'
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
  const keys = Object.entries(config_shortcut).map(([key]) => key)

  return Object.fromEntries(
    keys.map((key) => [key, (configStore as any)[key]]),
  ) as Pick<typeof configStore, keyof typeof config_shortcut>
}

export class KeyBinding {
  keydownWindow: Window = window

  constructor() {}

  private configKeyMap: Record<string, () => void> = {}

  private unListens: (() => void)[] = []
  private onKeydownFns = new Set<(e: KeyboardEvent) => void>()
  private onKeyupFns = new Set<(e: KeyboardEvent) => void>()

  updateKeydownWindow(keydownWindow: Window) {
    this.unload()

    this.keydownWindow = keydownWindow
    this.init()
  }

  init() {
    this.unload()
    this.keydownWindow.addEventListener(
      'keydown',
      this.handleKeyDown.bind(this),
    )
    this.keydownWindow.addEventListener(
      'dm-keydown' as any,
      this.handleCustomKeyDown.bind(this),
    )
    this.keydownWindow.addEventListener('keyup', this.handleKeyUp.bind(this))
    this.keydownWindow.addEventListener(
      'dm-keyup' as any,
      this.handleCustomKeyUp.bind(this),
    )

    this.unListens.push(
      autorun(() => {
        this.configKeyMap = {}
        const configs = getShortcutConfigs()
        Object.entries(configs).forEach(([name, keys]) => {
          const key = keys.join('+')
          this.configKeyMap[key] = () => {
            const command = name.replace('shortcut_', 'command_') as any
            console.log('command', command)
            eventBus.emit(command)
          }
        })
      }),
    )
  }

  unload() {
    this.keydownWindow.removeEventListener(
      'keydown',
      this.handleKeyDown.bind(this),
    )
    this.keydownWindow.removeEventListener(
      'dm-keydown' as any,
      this.handleCustomKeyDown.bind(this),
    )
    this.keydownWindow.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.keydownWindow.removeEventListener(
      'dm-keyup' as any,
      this.handleCustomKeyUp.bind(this),
    )

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
    e.stopPropagation()

    const { keyCode, shiftKey, ctrlKey } = e
    // if (key.length === 1) key = key.toLowerCase()
    const actions: Key[] = []

    if (shiftKey && keyCode !== keyToKeyCodeMap.Shift) actions.push('Shift')
    if (ctrlKey && keyCode !== keyToKeyCodeMap.Ctrl) actions.push('Ctrl')

    actions.push(...formatKeys((keyCodeToCode as any)[keyCode]))

    const mapKey = actions.join('+')

    // console.log('mapKey', mapKey)

    if (this.configKeyMap[mapKey]) {
      e.preventDefault()

      this.configKeyMap[mapKey]()
      return
    }

    this.onKeydownFns.forEach((fn) => fn(e))
  }
  protected handleKeyUp(e: KeyboardEvent) {
    const tar = e.target as HTMLElement
    if (
      tar.tagName === 'TEXTAREA' ||
      tar.tagName === 'INPUT' ||
      tar.contentEditable === 'true'
    )
      return
    e.stopPropagation()

    const { keyCode, shiftKey, ctrlKey } = e
    // if (key.length === 1) key = key.toLowerCase()
    const actions: Key[] = []

    if (shiftKey && keyCode !== keyToKeyCodeMap.Shift) actions.push('Shift')
    if (ctrlKey && keyCode !== keyToKeyCodeMap.Ctrl) actions.push('Ctrl')

    actions.push(...formatKeys((keyCodeToCode as any)[keyCode]))

    const mapKey = actions.join('+')

    this.onKeyupFns.forEach((fn) => fn(e))
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
