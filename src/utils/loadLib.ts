import AsyncLock from './AsyncLock'

const libLoadedMap: Record<any, AsyncLock> = {}

export async function loadLib(lib: string): Promise<void> {
  if (libLoadedMap[lib]) {
    await libLoadedMap[lib].waiting()
    return
  }

  return new Promise((res) => {
    const lock = new AsyncLock()
    libLoadedMap[lib] = lock
    const scriptEl = document.createElement('script')
    scriptEl.src = chrome.runtime.getURL(`assets/lib/${lib}`)
    scriptEl.addEventListener('load', () => {
      lock.ok()
      res()
    })
    document.body.appendChild(scriptEl)
  })
}
