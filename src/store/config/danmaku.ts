import { config as _config, initSetting } from '@apad/setting-panel'

const category = '弹幕'
const config: typeof _config = (props) => ({ ...props, category })

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}

const config_danmaku = {
  danSpeed: config({
    defaultValue: 20,
    label: '弹幕速度',
    desc: '受 canvas渲染的帧数 影响，每次x+=val/10',
  }),
  danVerticalSafeTime: config({
    defaultValue: 5,
    label: '垂直弹幕停留时间',
  }),
  opacity: config({
    defaultValue: 1,
    desc: '范围0 ~ 1',
    label: '弹幕透明度',
  }),
  fontSize: config({
    defaultValue: 16,
    label: '弹幕字体大小',
  }),
  fontWeight: config({
    defaultValue: 600,
    label: '弹幕字体宽度',
  }),
  fontFamily: config({
    defaultValue: 'Segoe UI Emoji, SimHei, "microsoft yahei", sans-serif',
    label: '弹幕字体',
  }),
  fontShadow: config({
    defaultValue: true,
    label: '弹幕阴影加深',
    desc: '额外渲染了一次字体，可能会加大性能消耗',
  }),
  gap: config({
    defaultValue: 4,
    desc: '默认为4',
    label: '上下弹幕之间的间距',
  }),
  maxTunnel: config<MaxTunnelType>({
    defaultValue: MaxTunnelType['1/2'],
    label: '弹幕最大渲染行数',
    type: 'group',
    group: [MaxTunnelType['1/2'], MaxTunnelType['1/4'], MaxTunnelType.full],
  }),

  adjustFontsizeByPIPWidthResize: config({
    defaultValue: false,
    label: '动态字体大小',
    desc: '画中画大小改变时字体大小跟着调整',
  }),
  adjustFontsizeStartWidth: config({
    defaultValue: 500,
    label: '标准宽度',
    desc: '画中画在这个宽度时是 $弹幕字体大小 设定的大小，往小了字体不会缩小，往大了字体跟着放大',
    relateBy: 'adjustFontsizeByPIPWidthResize',
    relateByValue: true,
  }),
  adjustFontsizeScaleRate: config({
    defaultValue: 0.6,
    label: '弹幕字体大小缩放乘比',
    desc: '计算公式: 实际字体大小 = $弹幕字体大小 / $标准宽度 * $画中画此时宽度 * $val',
    relateBy: 'adjustFontsizeByPIPWidthResize',
    relateByValue: true,
  }),
  adjustFontsizeMaxSize: config({
    defaultValue: 24,
    label: '最大字体大小',
    desc: '限制调整的最大字体大小',
    relateBy: 'adjustFontsizeByPIPWidthResize',
    relateByValue: true,
  }),
}

export default config_danmaku
