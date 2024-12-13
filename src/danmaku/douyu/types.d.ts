declare interface Window {
  rid: string
  SVGA: any
}

// 礼物数据
interface IGiftItem {
  n: string // 礼物名称
  pic: string // 礼物图片
  pc: number // 礼物价格
  svga: string //  礼物动画特效
}

interface IGiftData {
  [gid: string]: IGiftItem
}

// 贵族数据
interface INobleItem {
  name: string
  pic: string
}
interface INobleList {
  [id: string]: INobleItem
}
interface INobleData {
  prefix: string
  data: INobleList
}

// 弹幕颜色
interface IDanmakuColor {
  [id: string]: string
}

declare class Ex_WebSocket_UnLogin {
  constructor(
    rid: string,
    msgHandler: (msg: string) => void,
    closeHandler?: () => void,
  )
  public close(): void
}

interface IDanmaku {
  nn: string // 昵称
  avatar: string // 头像地址 https://apic.douyucdn.cn/upload/ + avatar + _small.jpg
  lv: string // 等级
  txt: string // 弹幕内容
  color: string // 弹幕颜色 undefine就是普通弹幕 2蓝色 3绿色 6粉色 4橙色 5紫色 1红色
  fansName: string // 粉丝牌名字
  fansLv: string // 粉丝牌等级
  isDiamond: boolean // 是否是钻粉
  nobleLv: string // 贵族等级
  isNoble: boolean // 贵族弹幕是否开启，1开
  isRoomAdmin: boolean // 房管，data.rg为4则是房管
  isSuper: boolean // 超管，data.pg为5则为超管
  isVip: boolean // vip，如果是 453/则为vip  454/则为超级vip
  key: string | number // 唯一标识
}

interface IEnter {
  nn: string // 昵称
  avatar: string // 头像地址 https://apic.douyucdn.cn/upload/ + avatar + _small.jpg
  lv: string // 等级
  nobleLv: string // 贵族等级
  key: string | number // 唯一标识
}

interface IGift {
  type: 'gift' | 'diamond' | 'noble' | 'fans' // 礼物类型
  name: string // 礼物名称
  nn: string // 昵称
  lv: string // 等级
  nl: string // 贵族等级
  bl: string // 粉丝牌等级
  gfid: string // 礼物ID
  gfcnt: string // 礼物数量
  hits: string // 连击
  key: string | number // 唯一标识
}

interface ISuperchat extends IDanmaku {
  price: number // 贡献值
  time: number // 创建时间
}

// 主题切换
type IMode = 'day' | 'night'

// 每个模块开关，同时指定了顺序。值：["enter"; "gift"; "danmaku", "data"]
type IOptionsSwitch = 'enter' | 'gift' | 'danmaku' | 'superchat'

// 显示模式，default是指斗鱼弹幕助手模式，panel是用于OBS展示用的模式
type IShowMode = 'default' | 'panel' | 'superchat'

interface IOptions {
  showMode: IShowMode // 显示模式。值：default/panel
  mode: IMode // 日间模式还是夜间模式。值：day/night
  switch: IOptionsSwitch[]
  direction: 'column' | 'row' // 纵向还是横向排列。值：row/column
  fontSize: number // 字号大小
  size: ISize // 每个模块的占比%
  align: 'left' | 'right' // 设置左右对齐。值：left/right
  animation: boolean // 是否开启动画
  threshold: number // 数据上限，超过上限的数据会被删除
  transparent: boolean // 是否背景透明
  danmaku: IOptionsDanmaku // 弹幕设置
  gift: IOptionsGift // 礼物设置
  enter: IOptionsEnter // 入场设置
  showStatus: boolean // 是否开启统计数据
  superchat: IOptionsSuperchat // superchat设置
  showNobleNum: boolean // 是否显示贵宾数
}

interface ISize {
  danmaku: number
  enter: number
  gift: number
  superchat: number
}

// 弹幕显示元素。值：level:等级  avatar:头像  fans:粉丝牌  noble:贵族  roomAdmin:房管  diamond:钻粉  vip:VIP  color:弹幕颜色 time:时间
type IOptionsDanmakuShow =
  | 'level'
  | 'avatar'
  | 'fans'
  | 'noble'
  | 'roomAdmin'
  | 'diamond'
  | 'vip'
  | 'color'
  | 'time'

interface IOptionsDanmaku {
  show: IOptionsDanmakuShow[]
  keyNicknames: string[] // 高亮昵称
  ban: IOptionsDanmakuBan
}
interface IOptionsDanmakuBan {
  level: number // 等级小于等于
  keywords: string[] // 关键词
  nicknames: string[] // 关键昵称
  isFilterRepeat: boolean // 是否过滤重复弹幕，如果下一条内容与上一条一样，则丢弃
  isFilterRobot: boolean // 是否过滤机器人弹幕，判断条件为是否有dms属性
}

// 入场显示元素。值：level:等级  avatar:头像   noble:贵族
type IOptionsEnterShow = 'level' | 'avatar' | 'noble' | 'time'
interface IOptionsEnter {
  show: IOptionsEnterShow[]
  keywords: string[] // 高亮关键昵称
  ban: IOptionsEnterBan
}

interface IOptionsEnterBan {
  level: number // 等级小于等于
}

interface IOptionsGift {
  totalPrice: number // 高亮总价大于等于
  fansLevel: number // 高亮粉丝牌升级大于等于
  ban: IOptionsGiftBan
  showEffect: boolean // 是否显示礼物特效
}

interface IOptionsGiftBan {
  price: number // 价格小于
  keywords: string[] // 礼物昵称
  fansLevel: number // 粉丝牌升级显示等级>=
}

interface IGiftStatistics {
  [key: string]: IGiftStatisticsInfo
}

interface IGiftStatisticsInfo {
  gfid: string // 礼物ID
  img: string // 礼物图片
  name: string // 礼物名称
  price: number // 价格
  count: number // 数量
}

type IMsgType =
  | 'danmaku'
  | 'gift'
  | 'enter'
  | 'data'
  | 'superchat'
  | 'fansPaper'
  | 'professgiftsrc'
  | ''

interface IPanelData {
  type: IMsgType
  data: IGift | IDanmaku | IEnter
}

type IOptionsSuperchatShow = 'fans' | 'noble' | 'roomAdmin' | 'diamond'

interface IOptionsSuperchat {
  keyword: string // 触发关键词
  options: ISuperchatOption[] // sc的配置项
  show: IOptionsSuperchatShow[]
  speak: boolean // 是否语音播报
}

interface ISuperchatOption {
  // 颜色配置项
  bgColor: ISuperchatOptionColor
  // 最低触发价格
  minPrice: number
  // 停留时间（秒）
  time: number
}

interface ISuperchatOptionColor {
  header: string
  body: string
}
