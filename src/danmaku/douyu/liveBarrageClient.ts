import EventEmitter from 'events'
import { Ex_WebSocket_UnLogin } from './websokect'
import { getStrMiddle, getTransColor } from './utils'
import { STT } from './STT'

type LiveEvent = {
  danmu: { color: string; text: string }
}

export default class DouyuLiveBarrageClient extends EventEmitter {
  ws: Ex_WebSocket_UnLogin
  stt = new STT()
  constructor(public id: string | number) {
    super()
    this.initWs()
  }

  initWs() {
    this.ws = new Ex_WebSocket_UnLogin(
      this.id,
      this.handleMsg.bind(this),
      () => {
        this.ws.close()
        this.initWs()
      }
    )
  }

  handleMsg(msg: string) {
    let msgType = getStrMiddle(msg, 'type@=', '/')
    if (!msgType) {
      return
    }
    if (msgType === 'chatmsg') {
      let data = this.stt.deserialize(msg)
      // 超管弹幕
      // {"type":"chatmsg","rid":"4624967","uid":"409227923","nn":"鲨鱼仟仟","txt":"提醒主播，请主播调整自己的上装，请勿深V着装。请尽快调整，谢谢合作。","cid":"609ef1a236494f5c9c85300000000000","ic":"avatar_v3/202105/7b4b257d45c74deab9ff4e57746fd8a5","level":"7","sahf":"1","admzq":"1","pg":"5","cst":"1639922444040","bl":"0","brid":"0","pdg":"35","pdk":"81"}
      //   if (!checkDanmakuValid(data)) {
      //     return
      //   }
      let obj = {
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
        vip: data.ail == '453/' || data.ail == '454/', // vip，如果是 453/则为vip  454/则为超级vip
        key: data.cid, // 时间戳
      }
      this.emit('danmu', {
        text: obj.txt,
        color: getTransColor(obj.color),
      })
      //   if (danmakuList.value.length + 1 > options.value.threshold) {
      //     danmakuList.value.shift()
      //   }
      //   danmakuList.value.push(obj)
      //   if (options.value.isSaveData) {
      //     danmakuListSave.push(msg)
      //   }
    }
    if (
      [
        'dgb',
        'odfbc',
        'rndfbc',
        'anbc',
        'rnewbc',
        'blab',
        'fansupgradebroadcast',
      ].includes(msgType) /* &&
      options.value.switch.includes('gift') */
    ) {
      return
      let data = this.stt.deserialize(msg)
      // 续费钻粉
      // {"type":"rndfbc","uid":"573096","rid":"5189167","nick":"一只小洋丶","icon":"avatar_v3/202111/d7d383be4c874af0b50e3d9eb58ad462","level":"39","nl":"0","pg":"1","fl":"24","bn":"歆崽"}

      // 开通钻粉
      // {"type":"odfbc","uid":"341314282","rid":"5189167","nick":"nt五香蛋","icon":"avatar_v3/202103/04d3d252139f4620bd417c6bef673bd6","level":"36","nl":"0","pg":"1","fl":"22","bn":"歆崽"}

      // 续费贵族
      // type@=rnewbc/rid@=0/gid@=0/bt@=1/uid@=21586042/unk@=卡卡罗特u丶/uic@=avatar_v3@S202109@Sb2f34417c7f54595b14f8b3ad9243217/drid@=8780046/donk@=妮妮别吃了/nl@=5/

      // 开通贵族
      // type@=anbc/rid@=0/gid@=0/bt@=1/uid@=420070299/hrp@=1/unk@=王嘉尔一个人/uic@=avatar_v3@S202112@Sa60b00aa5e5845878ae43ff8299122bf/drid@=7034970/donk@=野鸡娘娘/nl@=4/ts@=1641350115/fov@=1/

      // 粉丝牌升级
      // type@=blab/uid@=377858580/nn@=Heroes728/lbl@=13/bl@=14/ba@=1/bnn@=教主丶/diaf@=0/rid@=312212/

      // 30级以上粉丝牌升级
      // btype@=fansupgradebroadcast/blackCate2s@=/avatar@=/blackUids@=/type@=configscreen/rid@=533813/userName@=命運舵手/anchorName@=TD丶正直博/blackRids@=/gbtemp@=465/nrt@=0/txt2@=/txt3@=/userLevelMin@=0/now@=1641356569850/txt1@=/blackCate1s@=/vsrc@=/otherContent@=41/
      let obj = {}
      /*  switch (msgType) {
        case 'dgb':
          // 正常礼物
          if (!checkGiftValid(data)) {
            return
          }
          obj = {
            type: '礼物',
            nn: data.nn, // 昵称
            lv: data.level, // 等级
            gfid: data.gfid, // 礼物id 获取名字：allGiftData[item.gfid].n
            gfcnt: data.gfcnt, // 礼物数量
            hits: data.hits, // 连击
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        case 'odfbc':
          // 开通钻粉
          obj = {
            type: '钻粉',
            name: '开通钻粉',
            nn: data.nick,
            lv: data.level,
            gfid: '0',
            gfcnt: '1',
            hits: '1',
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        case 'rndfbc':
          // 续费钻粉
          obj = {
            type: '钻粉',
            name: '续费钻粉',
            nn: data.nick,
            lv: data.level,
            gfid: '0',
            gfcnt: '1',
            hits: '1',
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        case 'anbc':
          // 开通贵族
          if (data.drid != window.rid) {
            return // 不在本房间开通则丢弃
          }
          obj = {
            type: '贵族',
            name: '开通' + nobleData[data.nl].name,
            nn: data.unk,
            nl: data.nl, // 贵族等级
            gfid: '0',
            gfcnt: '1',
            hits: '1',
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        case 'rnewbc':
          // 续费贵族
          if (data.drid != window.rid) {
            return // 不在本房间开通则丢弃
          }
          obj = {
            type: '贵族',
            name: '续费' + nobleData[data.nl].name,
            nn: data.unk,
            nl: data.nl, // 贵族等级
            gfid: '0',
            gfcnt: '1',
            hits: '1',
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        case 'blab':
          // 30级以下粉丝牌升级
          if (data.rid !== window.rid) {
            return // 不在本房间 则丢弃
          }
          if (!checkFansLevelValid(data.bl)) {
            return
          }
          obj = {
            type: '粉丝牌升级',
            name: '粉丝牌升到' + String(data.bl) + '级',
            nn: data.nn,
            bl: data.bl,
            gfid: '0',
            gfcnt: '1',
            hits: '1',
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        case 'fansupgradebroadcast':
          // 30以上粉丝牌升级
          if (data.rid !== window.rid) {
            return // 不在本房间 则丢弃
          }
          if (!checkFansLevelValid(data.otherContent)) {
            return
          }
          obj = {
            type: '粉丝牌升级',
            name: '粉丝牌升到' + String(data.otherContent) + '级',
            nn: data.userName,
            bl: data.otherContent,
            gfid: '0',
            gfcnt: '1',
            hits: '1',
            key: new Date().getTime() + Math.random(),
          }
          if (giftList.value.length + 1 > options.value.threshold) {
            giftList.value.shift()
          }
          giftList.value.push(obj)
          if (options.value.isSaveData) {
            giftListSave.push(msg)
          }
          break
        default:
          break
      } */
    }
    /* if (msgType === 'uenter' && options.value.switch.includes('enter')) {
      let data = stt.deserialize(msg)
      if (!checkEnterValid(data)) {
        return
      }
      let obj = {
        nn: data.nn,
        avatar: data.ic, // 头像地址 https://apic.douyucdn.cn/upload/ + avatar + _small.jpg
        lv: data.level, // 等级
        noble: data.nl, // 贵族等级
        key: new Date().getTime() + Math.random(),
      }
      if (enterList.value.length + 1 > options.value.threshold) {
        enterList.value.shift()
      }
      enterList.value.push(obj)
      if (options.value.isSaveData) {
        enterListSave.push(msg)
      }
    } */
  }

  addEventListener<TType extends keyof LiveEvent>(
    e: TType,
    cb: (data: LiveEvent[TType]) => void
  ) {
    return super.addListener(e as string, cb)
  }
  emit<TType extends keyof LiveEvent>(
    eventName: TType,
    args: LiveEvent[TType]
  ): boolean {
    return super.emit(eventName, args)
  }
}
