import { createElement, waitLoopCallback } from '@root/utils'
import type WebProvider from '@root/core/WebProvider/WebProvider'
import { PlayerComponent } from '../types'

// 好像不能从iframe里把videoEl扣出来，youtube抠出来也会play error，不止b站的问题...
export default class VideoChanger implements PlayerComponent {
  onInit() {}
  onUnload() {}
  init() {}
  unload() {}
  iframe = createElement('iframe', {
    style: `position:fixed;width:${window.innerWidth}px;height:${window.innerHeight}px;top:0;left:0;visibility: hidden;`,
  })
  webProvider: WebProvider

  constructor(webProvider: WebProvider) {
    document.body.appendChild(this.iframe)
    this.webProvider = webProvider
  }

  protected openUrl(url: string) {
    return new Promise<void>((res) => {
      this.iframe.src = url

      const handleOnLoad = () => {
        res()
        this.iframe.removeEventListener('load', handleOnLoad)
      }
      this.iframe.addEventListener('load', handleOnLoad)
    })
  }

  async changeVideo(url: string) {
    if (!this.webProvider.miniPlayer) throw Error('还没有挂载上miniPlayer')
    await this.openUrl(url)
    let newWebVideoEl!: HTMLVideoElement
    await waitLoopCallback(() => {
      if (this.iframe.contentDocument) {
        newWebVideoEl = this.webProvider.getVideoEl(this.iframe.contentDocument)
      }
      return !!newWebVideoEl
    })

    if (!newWebVideoEl) throw Error('找不到新iframe下的webVideo')
    // this.webProvider.miniPlayer.updateWebVideoPlayerEl(newWebVideoEl)
  }
}
