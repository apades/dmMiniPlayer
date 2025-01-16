import configStore, { videoBorderType } from '@root/store/config'
import { createElement } from '@root/utils'
import {
  getBrowserSyncStorage,
  setBrowserSyncStorage,
} from '@root/utils/storage'
import { WebProvider } from '.'
import { PlayerEvent } from '../event'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import { PIP_WINDOW_CONFIG } from '@root/shared/storeKey'
import { sendMessage } from 'webext-bridge/content-script'
import WebextEvent from '@root/shared/webextEvent'
import { Position } from '@root/store/config/docPIP'
import { autorun } from 'mobx'

export default class DocPIPWebProvider extends WebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected MiniPlayer = HtmlVideoPlayer

  pipWindow?: Window

  async onOpenPlayer() {
    // 获取应该有的docPIP宽高
    const pipWindowConfig = await getBrowserSyncStorage(PIP_WINDOW_CONFIG)
    let width = pipWindowConfig?.width ?? this.webVideo.clientWidth,
      height = pipWindowConfig?.height ?? this.webVideo.clientHeight

    console.log('pipWindowConfig', pipWindowConfig)
    // cw / ch = vw / vh
    const vw = this.webVideo.videoWidth,
      vh = this.webVideo.videoHeight

    switch (configStore.videoNoBorder) {
      // cw = vw / vh * ch
      case videoBorderType.height: {
        width = (vw / vh) * height
        break
      }
      // ch = vh / vw * cw
      case videoBorderType.width: {
        height = (vh / vw) * width
        break
      }
    }

    await this.miniPlayer.init()
    const playerEl = this.miniPlayer.playerRootEl
    if (!playerEl) {
      console.error('不正常的miniPlayer.init()，没有 playerEl', this.miniPlayer)
      throw Error('不正常的miniPlayer.init()')
    }

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      height,
    })
    this.pipWindow = pipWindow

    this.addOnUnloadFn(
      autorun(() => {
        if (configStore.movePIPInOpen) {
          const [x, y] = (() => {
            switch (configStore.movePIPInOpen_basePos) {
              case Position['top-left']:
                return [0, 0]
              case Position['top-right']:
                return [screen.width - width, 0]
              case Position['bottom-left']:
                return [0, screen.height - height]
              case Position['bottom-right']:
                return [screen.width - width, screen.height - height]
            }
          })()
          sendMessage(WebextEvent.moveDocPIPPos, {
            docPIPWidth: width,
            x: x + configStore.movePIPInOpen_offsetX,
            y: y + configStore.movePIPInOpen_offsetY,
          })
        }
      }),
    )

    // 挂载事件
    pipWindow.addEventListener('pagehide', () => {
      // 保存画中画的大小
      if (!this.isQuickHiding) {
        setBrowserSyncStorage(PIP_WINDOW_CONFIG, {
          height: pipWindow.innerHeight,
          width: pipWindow.innerWidth,
        })
      }
      this.emit(PlayerEvent.close)
    })
    pipWindow.addEventListener('resize', () => {
      this.emit(PlayerEvent.resize)
    })

    this.on(PlayerEvent.close, () => {
      try {
        pipWindow.close()
      } catch (error) {}
    })

    pipWindow.document.body.appendChild(playerEl)

    // docPIP有自带的样式，需要覆盖掉
    const docPIPRootStyle = createElement('style', {
      innerHTML: `body{
  margin: 0;
  background-color: #000;
}
video{
  width: 100%;
  height: 100%;
}
canvas{
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  pointer-events: none;
}`,
    })
    playerEl.appendChild(docPIPRootStyle)
  }
}
