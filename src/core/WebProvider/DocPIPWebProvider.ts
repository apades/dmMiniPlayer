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
              case Position['topLeft']:
                return [0, 0]
              case Position['topRight']:
                return [screen.width - width, 0]
              case Position['bottomLeft']:
                return [0, screen.height - height]
              case Position['bottomRight']:
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

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const isUp = e.deltaY < 0

      const {
        outerHeight: height,
        outerWidth: width,
        screenLeft: left,
        screenTop: top,
      } = pipWindow
      const scale = isUp ? 1.03 : 0.97

      const { width: sw, height: sh } = screen

      const x = sw / 2 - left > left + width - sw / 2 ? 'left' : 'right'
      const y = sh / 2 - top > top + height - sh / 2 ? 'top' : 'bottom'

      const newHeight = ~~(height * scale),
        newWidth = ~~(newHeight * (width / height))

      const docPIPWidth = pipWindow.innerWidth

      switch (`${x}${y}`) {
        case 'lefttop':
          sendMessage(WebextEvent.resizeDocPIP, {
            docPIPWidth,
            height: newHeight,
            width: newWidth,
          })
          break
        case 'righttop': {
          const newLeft = left - (newWidth - width)
          sendMessage(WebextEvent.updateDocPIPRect, {
            docPIPWidth,
            height: newHeight,
            width: newWidth,
            left: newLeft,
          })
          break
        }
        case 'leftbottom': {
          const newTop = top - (newHeight - height)
          sendMessage(WebextEvent.updateDocPIPRect, {
            docPIPWidth,
            height: newHeight,
            width: newWidth,
            top: newTop,
          })
          break
        }
        case 'rightbottom': {
          const newLeft = left - (newWidth - width)
          const newTop = top - (newHeight - height)
          sendMessage(WebextEvent.updateDocPIPRect, {
            docPIPWidth,
            height: newHeight,
            width: newWidth,
            left: newLeft,
            top: newTop,
          })
        }
      }
    }
    pipWindow.addEventListener('wheel', handleWheel, { passive: false })

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
      pipWindow.removeEventListener('wheel', handleWheel)
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
