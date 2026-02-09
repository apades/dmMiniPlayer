import { ValueOf } from 'type-fest'

export const invertObj = <Obj extends Record<string, any>>(
  obj: Obj,
): { [P in keyof Obj as Obj[P]]: P } =>
  Object.fromEntries(Object.entries(obj).map(([key, code]) => [code, key]))

export const keyToKeyCodeMap = {
  '0': 48,
  '1': 49,
  '2': 50,
  '3': 51,
  '4': 52,
  '5': 53,
  '6': 54,
  '7': 55,
  '8': 56,
  '9': 57,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Shift: 16,
  Ctrl: 17,
  Alt: 18,
  Pause: 19,
  Escape: 27,
  Space: 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  '←': 37,
  ArrowUp: 38,
  '↑': 38,
  ArrowRight: 39,
  '→': 39,
  ArrowDown: 40,
  '↓': 40,
  Insert: 45,
  Delete: 46,
  ';': 186,
  '=': 187,
  Meta: 224,
  ContextMenu: 93,
  '*': 106,
  '+': 107,
  '-': 189,
  '.': 190,
  '/': 191,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  ',': 188,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222,
} as const

export const keyCodeToCode = invertObj(keyToKeyCodeMap)

export const getKeyboardCodesByKey = (key: keyof typeof keyToKeyCodeMap) => {
  const keyCode = keyToKeyCodeMap[key]
  const code = keyCodeToCode[keyCode]
  return {
    code,
    key,
    keyCode,
  }
}

export const KeyType = {
  keydown: '(keydown)',
  keyup: '(keyup)',
  press: '(press)',
} as const
export type Key =
  | keyof typeof keyToKeyCodeMap /* | (string & {}) */
  | ValueOf<typeof KeyType>
