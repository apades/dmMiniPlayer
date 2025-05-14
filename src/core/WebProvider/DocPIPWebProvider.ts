import { PIP_WINDOW_CONFIG } from '@root/shared/storeKey'
import WebextEvent from '@root/shared/webextEvent'
import configStore, { videoBorderType } from '@root/store/config'
import { calculateNewDimensions, createElement } from '@root/utils'
import { getDocPIPBorderSize } from '@root/utils/docPIP'
import {
  getBrowserSyncStorage,
  setBrowserSyncStorage,
} from '@root/utils/storage'
import { sendMessage } from 'webext-bridge/content-script'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import { PlayerEvent } from '../event'
import { WebProvider } from '.'

export default class DocPIPWebProvider extends WebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected MiniPlayer = HtmlVideoPlayer

  pipWindow?: Window

  async onOpenPlayer() {
    // 获取应该有的docPIP宽高
    const pipWindowConfig = await getBrowserSyncStorage(PIP_WINDOW_CONFIG)
    let width = pipWindowConfig?.width ?? this.webVideo.clientWidth,
      height = pipWindowConfig?.height ?? this.webVideo.clientHeight

    console.log('[docPIP_WH] pipWindowConfig', pipWindowConfig)
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

    // 调整宽高，使其能被4整除
    width = Math.floor(width / 4) * 4;
    height = Math.floor(height / 4) * 4;

    // 确保宽高比不变
    const aspectRatio = vw / vh;
    if (width / height > aspectRatio) {
      // 如果宽高比大于原始比率，调整高度
      height = Math.floor(width / aspectRatio);
    } else {
      // 如果宽高比小于或等于原始比率，调整宽度
      width = Math.floor(height * aspectRatio);
    }

    await this.miniPlayer.init()
    const playerEl = this.miniPlayer.playerRootEl
    if (!playerEl) {
      console.error('不正常的miniPlayer.init()，没有 playerEl', this.miniPlayer)
      throw Error('不正常的miniPlayer.init()')
    }

    await sendMessage(WebextEvent.beforeStartPIP, null)
    console.log('[docPIP_WH] real width height', { width, height })
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      height,
    })
    this.pipWindow = pipWindow
    await sendMessage(WebextEvent.afterStartPIP, {
      width: pipWindow.innerWidth,
    })

    // 这里卡50是往前系统API给的outerWidth innerWidth都是乱的，就这里正常
    const [borX, borY] = getDocPIPBorderSize(pipWindow)

    let [realWidth, realHeight] = [width + borX, height + borY]

    // 低DPR屏幕到高DPR屏幕需要缩小wh，高到低就不需要😓
    if (
      pipWindowConfig?.pipDPR &&
      pipWindowConfig?.pipDPR > window.devicePixelRatio
    ) {
      realWidth = ~~(realWidth / pipWindowConfig?.pipDPR)
      realHeight = ~~(realHeight / pipWindowConfig?.pipDPR)
    }

    // ! 已经确定是chrome的bug，网页里第二次打开不会按照width和height来设置窗口大小，需要自己调整
    await sendMessage(WebextEvent.updateDocPIPRect, {
      width: realWidth,
      height: realHeight,
      docPIPWidth: pipWindow.innerWidth,
      left: pipWindowConfig?.left,
      top: pipWindowConfig?.top,
    })

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

      const [newWidth, newHeight] = calculateNewDimensions(width, height, scale)

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
        const [width, height] = [pipWindow.innerWidth, pipWindow.innerHeight]
        console.log('[docPIP_WH] save width and height', { width, height })
        setBrowserSyncStorage(PIP_WINDOW_CONFIG, {
          height,
          width,
          left: pipWindow.screenLeft,
          top: pipWindow.screenTop,
          mainDPR: window.devicePixelRatio,
          pipDPR: pipWindow.devicePixelRatio,
        })
      }
      this.emit(PlayerEvent.close)
      pipWindow.removeEventListener('wheel', handleWheel)
      sendMessage(WebextEvent.closePIP, null)
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

  close(): void {
    this.pipWindow?.close?.()
  }
}
