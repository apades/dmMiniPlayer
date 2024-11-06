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

    // 挂载事件
    pipWindow.addEventListener('pagehide', () => {
      this.emit(PlayerEvent.close)
      setBrowserSyncStorage(PIP_WINDOW_CONFIG, {
        height: pipWindow.innerHeight,
        width: pipWindow.innerWidth,
      })
    })
    pipWindow.addEventListener('resize', () => {
      this.emit(PlayerEvent.resize)
    })

    this.addCallback(
      this.on2(PlayerEvent.close, () => {
        try {
          pipWindow.close()
        } catch (error) {}
      })
    )

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

    // 弹幕器相关
    if (this.danmakuEngine) {
      const danmakuContainer = createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
        },
      })
      playerEl.appendChild(danmakuContainer)
      this.danmakuEngine.init({
        media: this.webVideo,
        container: danmakuContainer,
      })
    }
  }
}
