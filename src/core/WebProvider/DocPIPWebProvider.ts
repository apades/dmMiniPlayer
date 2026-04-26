import {
  PIP_WINDOW_CONFIG,
  PIP_WINDOW_OFFSET_CONFIG,
} from '@root/shared/storeKey'
import WebextEvent from '@root/shared/webextEvent'
import configStore, { videoBorderType } from '@root/store/config'
import { calculateNewDimensions, createElement, wait } from '@root/utils'
import { getDocPIPBorderSize } from '@root/utils/docPIP'
import {
  getBrowserLocalStorage,
  getBrowserSyncStorage,
  setBrowserLocalStorage,
  setBrowserSyncStorage,
} from '@root/utils/storage'
import { sendMessage } from 'webext-bridge/content-script'
import { MovePIPAfterOpenType, Position } from '@root/types/config'
import { autorun } from 'mobx'
import { isEqual } from 'lodash-es'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import { PlayerEvent } from '../event'
import { WebProvider } from '.'

export default class DocPIPWebProvider extends WebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected override MiniPlayer = HtmlVideoPlayer

  pipWindow?: Window

  override async onOpenPlayer() {
    // 在标题后添加 ' - PIP'
    const title = document.title
    const pipTitle = title + ' - PIP'
    document.title = pipTitle

    // 获取应该有的docPIP宽高
    const pipWindowConfig = await getBrowserLocalStorage(PIP_WINDOW_CONFIG)
    const pipWindowOffsetConfig = await getBrowserLocalStorage(
      PIP_WINDOW_OFFSET_CONFIG,
      {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
    )
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

    await sendMessage(WebextEvent.beforeStartPIP, null)
    await this.miniPlayer.init(this.config)
    const playerEl = this.miniPlayer.playerRootEl
    if (!playerEl) {
      console.error('不正常的miniPlayer.init()，没有 playerEl', this.miniPlayer)
      throw Error('不正常的miniPlayer.init()')
    }

    console.log('[docPIP_WH] real width height', { width, height })
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      height,
    })
    this.pipWindow = pipWindow

    let isUpdatePosOk = false
    // 这里await会莫名其妙使webVideo被暂停
    sendMessage(WebextEvent.afterStartPIP, {
      width: pipWindow.innerWidth,
    }).then(async () => {
      switch (configStore.movePIPInOpen) {
        case MovePIPAfterOpenType.lastPos: {
          if (!pipWindowConfig) break
          const [borX, borY] = getDocPIPBorderSize(pipWindow)
          console.log('borX, borY', borX, borY)

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
            docPIPWidth: pipWindow.innerWidth,
            width: realWidth - pipWindowOffsetConfig.width,
            height: realHeight - pipWindowOffsetConfig.height,
            left: pipWindowConfig.left - pipWindowOffsetConfig.left,
            top: pipWindowConfig.top - pipWindowOffsetConfig.top,
          })

          // 移动完有细小的偏移，需要调整一下
          // TODO: 得知窗口实际变化后的时间，现在先用固定秒代替
          // TODO: 多个屏幕的偏移都不一样，或许能记录下是在哪个屏幕下的再套用偏移
          await wait(500)
          const offsetData = {
            left: pipWindow.screenLeft - pipWindowConfig.left,
            top: pipWindow.screenTop - pipWindowConfig.top,
            width: pipWindow.innerWidth - pipWindowConfig.width,
            height: pipWindow.innerHeight - pipWindowConfig.height,
          }

          console.log('[docPIP_WH] offsetData', offsetData, pipWindowConfig)
          setBrowserLocalStorage(PIP_WINDOW_OFFSET_CONFIG, {
            left: pipWindowOffsetConfig.left + offsetData.left,
            top: pipWindowOffsetConfig.top + offsetData.top,
            width: pipWindowOffsetConfig.width + offsetData.width,
            height: pipWindowOffsetConfig.height + offsetData.height,
          })
          if (Object.values(offsetData).some((v) => v !== 0)) {
            // await wait(1000)
            console.log('[docPIP_WH] update')
            await sendMessage(WebextEvent.updateDocPIPRect, {
              docPIPWidth: pipWindow.innerWidth,
              width: realWidth - pipWindowOffsetConfig.width,
              height: realHeight - pipWindowOffsetConfig.height,
              left: pipWindowConfig.left - pipWindowOffsetConfig.left,
              top: pipWindowConfig.top - pipWindowOffsetConfig.top,
            })
          }

          break
        }
        case MovePIPAfterOpenType.custom: {
          const [borX, borY] = getDocPIPBorderSize(pipWindow)
          // ! 已经确定是chrome的bug，第二次打开不会按照width和height来设置窗口大小
          await sendMessage(WebextEvent.resizeDocPIP, {
            width: width + borX,
            height: height + borY,
            docPIPWidth: pipWindow.innerWidth,
          })

          this.addOnUnloadFn(
            autorun(() => {
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
            }),
          )
          break
        }
      }

      isUpdatePosOk = true
    })

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopPropagation()
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
    pipWindow.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true,
    })

    let lastSavedPIPRect:
      | {
          width: number
          height: number
          left: number
          top: number
          mainDPR: number
          pipDPR: number
        }
      | undefined
    let firstSave = true

    const savePIPPosData = (force = false) => {
      if (!force && firstSave) {
        firstSave = false
        return
      }
      if (!isUpdatePosOk) return
      if (this.isQuickHiding) return

      const newPosData = {
        width: pipWindow.innerWidth + configStore.saveWidthOnDocPIPCloseOffset,
        height:
          pipWindow.innerHeight + configStore.saveHeightOnDocPIPCloseOffset,
        left: pipWindow.screenLeft,
        top: pipWindow.screenTop,
        mainDPR: window.devicePixelRatio,
        pipDPR: pipWindow.devicePixelRatio,
      }

      const prev = lastSavedPIPRect
      if (prev && isEqual(prev, newPosData)) {
        return
      }

      lastSavedPIPRect = newPosData
      setBrowserLocalStorage(PIP_WINDOW_CONFIG, {
        ...newPosData,
      })
      console.log('[docPIP_WH] save pos data', newPosData)
    }

    const interval = setInterval(() => {
      savePIPPosData()
    }, 5000)
    // 挂载事件
    pipWindow.addEventListener('pagehide', () => {
      savePIPPosData(true)
      clearInterval(interval)
      this.emit(PlayerEvent.close)
      pipWindow.removeEventListener('wheel', handleWheel, { capture: true })
      sendMessage(WebextEvent.closePIP, null)

      this.webVideo.dispatchEvent(new Event('leavepictureinpicture'))

      // 恢复原始标题
      document.title = title
    })
    pipWindow.addEventListener('resize', () => {
      this.emit(PlayerEvent.resize)
      savePIPPosData()
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

    const keepAlive = setInterval(() => {
      sendMessage(WebextEvent.keepAlive, null)
    }, 1000)
    this.addOnUnloadFn(() => {
      clearInterval(keepAlive)
    })
  }

  override close(): void {
    this.pipWindow?.close?.()
  }
}
