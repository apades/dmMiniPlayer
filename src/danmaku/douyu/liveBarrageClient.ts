import BarrageClient from '@root/core/danmaku/BarrageClient'
import { STT } from './STT'
import { getRealRid, getStrMiddle, getTransColor } from './utils'
import { Ex_WebSocket_UnLogin } from './websokect'

export default class DouyuLiveBarrageClient extends BarrageClient {
  ws: Ex_WebSocket_UnLogin
  stt = new STT()
  constructor(public id: string | number) {
    super()
    this.initWs()
  }

  isClose = false
  async initWs() {
    this.ws = new Ex_WebSocket_UnLogin(
      await getRealRid(this.id + ''),
      this.handleMsg.bind(this),
      () => {
        if (this.isClose) return
        this.ws.close()
        this.initWs()
      },
    )
  }

  handleMsg(msg: string) {
    const msgType = getStrMiddle(msg, 'type@=', '/')
    if (!msgType) {
      return
    }
    if (msgType === 'chatmsg') {
      const data = this.stt.deserialize(msg)
      // 超管弹幕
      // {"type":"chatmsg","rid":"4624967","uid":"409227923","nn":"鲨鱼仟仟","txt":"提醒主播，请主播调整自己的上装，请勿深V着装。请尽快调整，谢谢合作。","cid":"609ef1a236494f5c9c85300000000000","ic":"avatar_v3/202105/7b4b257d45c74deab9ff4e57746fd8a5","level":"7","sahf":"1","admzq":"1","pg":"5","cst":"1639922444040","bl":"0","brid":"0","pdg":"35","pdk":"81"}
      //   if (!checkDanmakuValid(data)) {
      //     return
      //   }
      const obj = {
        nn: data.nn, // 昵称
        avatar: data.ic, // 头像地址 https://apic.douyucdn.cn/upload/ + avatar + _small.jpg
        lv: data.level, // 等级
        txt: data.txt, // 弹幕内容
        color: data.col, // 弹幕颜色 undefine就是普通弹幕 2蓝色 3绿色 6粉色 4橙色 5紫色 1红色
        fansName: data.bnn, // 粉丝牌名字
        fansLv: data.bl, // 粉丝牌等级
        diamond: data.diaf, // 是否是钻粉
        noble: data.nl, // 贵族等级
        nobleC: data.nc, // 贵族弹幕是否开启，1开
        roomAdmin: data.rg, // 房管，data.rg为4则是房管
        super: data.pg, // 超管，data.pg为5则为超管
        vip: data.ail === '453/' || data.ail === '454/', // vip，如果是 453/则为vip  454/则为超级vip
        key: data.cid, // 时间戳
      }
      this.emit('danmu', {
        text: obj.txt,
        color: getTransColor(obj.color),
      })
    }
  }

  close(): void {
    this.isClose = true
    this.ws.close()
  }
}
