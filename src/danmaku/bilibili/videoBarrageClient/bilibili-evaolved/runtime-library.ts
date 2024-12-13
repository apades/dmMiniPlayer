import type protobufType from 'protobufjs'

export interface RuntimeLibraryConfig<LibraryType> {
  url: string
  getModule: (window: Window) => LibraryType
}
export class RuntimeLibrary<LibraryType> implements PromiseLike<LibraryType> {
  private modulePromise: Promise<LibraryType>

  constructor(public config: RuntimeLibraryConfig<LibraryType>) {}

  async then<Resolve = LibraryType, Reject = never>(
    resolve?: (value: LibraryType) => Resolve | PromiseLike<Resolve>,
    reject?: (reason: any) => Reject | PromiseLike<Reject>,
  ) {
    try {
      const { url, getModule } = this.config
      if (!this.modulePromise) {
        this.modulePromise = (async () => {
          console.log(`[Runtime Library] Start download from ${url}`)
          const code: string = await fetch(url).then((res) => res.text())
          console.log(
            `[Runtime Library] Downloaded from ${url} , length = ${code.length}`,
          )
          let scriptEl = document.createElement('script')
          scriptEl.innerText = code
          document.body.appendChild(scriptEl)
          // ;(function runEval() {
          //   return eval(code)
          //   // eslint-disable-next-line no-extra-bind
          // }.bind(window)())
          return getModule(window)
        })()
      }
      const library = await this.modulePromise
      return resolve(library)
    } catch (error) {
      reject(error)
      throw error
    }
  }
}

const host = ``
export const protobufLibrary = new RuntimeLibrary<typeof protobufType>({
  url: chrome.runtime.getURL('lib/protobuf.js'),
  getModule: (window) => window.protobuf,
})
