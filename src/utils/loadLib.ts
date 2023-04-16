let libLoadedMap: Record<any, boolean> = {}

export async function loadLib(lib: string): Promise<void> {
  if (libLoadedMap[lib]) return

  return new Promise((res) => {
    let scriptEl = document.createElement('script')
    scriptEl.src = chrome.runtime.getURL(`lib/${lib}`)
    scriptEl.addEventListener('load', () => res())
    document.body.appendChild(scriptEl)

    libLoadedMap[lib] = true
  })
}
