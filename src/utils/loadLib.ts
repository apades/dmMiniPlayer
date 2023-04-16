import AsyncLock from './AsyncLock'

let libLoadedMap: Record<any, AsyncLock> = {}

export async function loadLib(lib: string): Promise<void> {
  if (libLoadedMap[lib]) {
    await libLoadedMap[lib].waiting()
    return
  }

  return new Promise((res) => {
    let lock = new AsyncLock()
    libLoadedMap[lib] = lock
    let scriptEl = document.createElement('script')
    scriptEl.src = chrome.runtime.getURL(`lib/${lib}`)
    scriptEl.addEventListener('load', () => {
      lock.ok()
      res()
    })
    document.body.appendChild(scriptEl)
  })
}
