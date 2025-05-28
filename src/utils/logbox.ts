const od = Object.defineProperty

// ---- logBox Map ----
const logBoxMap: {
  [key: string]: {
    color?: string
    disable?: boolean
  }
} = {}
window.logBoxMap = logBoxMap
od(logBoxMap, 'disableList', {
  get() {
    const arr: string[] = []
    Object.entries(logBoxMap).forEach(([key, val]) => {
      if (val.disable) arr.push(key)
    })
    return arr
  },
})
od(logBoxMap, 'activeList', {
  get() {
    const arr: string[] = []
    Object.entries(logBoxMap).forEach(([key, val]) => {
      if (!val.disable) arr.push(key)
    })
    return arr
  },
})
od(logBoxMap, 'keys', {
  get: () => Object.keys(logBoxMap),
})
// ---- logBox Map ----

// ---- logBox Logs ----
const logBoxLogs: {
  [k: string]: { data: any[]; date: Date }[]
} & {
  getLogs?(types?: string[]): void
} = {}
window.logBoxLogs = logBoxLogs
od(logBoxLogs, 'getLogs', {
  enumerable: false,
})
// ---- logBox Logs ----

type reConsole = typeof console
type reConsoleConfig = Partial<{
  diableKey: boolean
}>
const generRandomColor = (seed: number) =>
  `#${Math.floor(seed * 16777215).toString(16)}`
export function logBox(key: string, config?: reConsoleConfig): reConsole {
  // if (!_env.isDev) return
  const _console = { ...console }
  const _log = console.log
  if (!logBoxMap[key]?.color) {
    let num: any = [...key]
      .map((t) => t.charCodeAt(0))
      .reduce((rs, val) => rs + val, 0)
      .toString()
      .split('')
      .reverse()
      .join('')

    num = num - 0
    while (num > 1) {
      num /= 10
    }
    const color = generRandomColor(num)
    logBoxMap[key] = {
      ...(logBoxMap[key] ?? []),
      color,
    }
  }
  _console.log = (...arg: Parameters<typeof _log>) => {
    const data = logBoxMap[key]

    if (data.disable) {
      logBoxLogs[key] = logBoxLogs[key] ?? ([] as any)
      logBoxLogs[key].push({
        data: arg,
        date: new Date(),
      })
    } else if (config?.diableKey) return _log(...arg)
    else _log(`%c[${key}]:`, `color:${data.color};`, ...arg)
  }
  return _console
}

logBox.disable = (keys: string[] | string) => {
  if (!Array.isArray(keys)) keys = [keys]
  keys.forEach((k) => {
    logBoxMap[k] = {
      ...(logBoxMap[k] ?? []),
      disable: true,
    }
  })
}

window.logBoxDisable = logBox.disable
