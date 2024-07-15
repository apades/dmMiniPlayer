import type MiniPlayer from '@root/core/miniPlayer'
import { dq1 } from '@root/utils'
import WebProvider from './webProvider'
import vpConfig from '@root/store/vpConfig'
import { runInAction } from 'mobx'
import { getDonghuafengDanmu } from '@root/danmaku/donghuafeng'
import type { DanType } from '@root/danmaku'
import type { MiniPlayerProps } from '@root/core/miniPlayer'

export default class DonghuafengProvider extends WebProvider {
  constructor() {
    super()
  }

  protected async initMiniPlayer(
    options?: MiniPlayerProps
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
      vpConfig.canShowDanmaku = true
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
