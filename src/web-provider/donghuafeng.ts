import type MiniPlayer from '@root/core/miniPlayer'
import type { DanType } from '@root/danmaku'
import { getDonghuafengDanmu } from '@root/danmaku/donghuafeng'
import vpConfig from '@root/store/vpConfig'
import { dq1 } from '@root/utils'
import { runInAction } from 'mobx'
import WebProvider from './webProvider'

export default class DonghuafengProvider extends WebProvider {
  constructor() {
    super()
  }

  protected async initMiniPlayer(
    options?: Partial<{ videoEl: HTMLVideoElement }>
  ): Promise<MiniPlayer> {
    const miniPlayer = await super.initMiniPlayer(options)

    this.initDans()
    miniPlayer.initBarrageSender({
      webTextInput: dq1('.danmu-text'),
      webSendButton: dq1('.danmu-send_btn'),
    })
    return miniPlayer
  }

  initDans() {
    runInAction(() => {
      vpConfig.canShowDanmakus = true
    })
    this.getDans().then((dans) =>
      this.miniPlayer.danmakuController.initDans(dans)
    )
  }

  async getDans(): Promise<DanType[]> {
    const id = new URLSearchParams(location.search).get('sn')
    return getDonghuafengDanmu(id)
  }
}
