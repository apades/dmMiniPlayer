import { WebProvider } from '@root/core/WebProvider'
import DanmakuSender from '@root/core/danmaku/DanmakuSender'
import { getDonghuafengDanmu } from '@root/danmaku/donghuafeng'
import { dq1, tryCatch } from '@root/utils'
import { t } from '@root/utils/i18n'
import toast from 'react-hot-toast'

export default class DonghuafengProvider extends WebProvider {
  onInit(): void {
    this.danmakuSender = new DanmakuSender()
    this.danmakuSender?.setData({
      webTextInput: dq1<HTMLInputElement>('.danmu-text'),
      webSendButton: dq1<HTMLElement>('.danmu-send_btn'),
    })
  }

  async onPlayerInitd() {
    const id = new URLSearchParams(location.search).get('sn') ?? ''

    const [err, danmakus] = await tryCatch(() => getDonghuafengDanmu(id))

    if (err) toast.error(t('error.danmakuLoad'))
    else this.danmakuEngine?.setDanmakus(danmakus)
  }
}
