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
    if (lib.indexOf('http') == 0) scriptEl.src = lib
    else scriptEl.src = chrome.runtime.getURL(`assets/lib/${lib}`)
    scriptEl.addEventListener('load', () => {
      lock.ok()
      res()
    })
    document.body.appendChild(scriptEl)
  })
}
