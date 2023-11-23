import { config as _config, initSetting } from '@apad/setting-panel'

const category = 'bilibili'
const config: typeof _config = (props) => ({ ...props, category })

export enum MaxTunnelType {
  '1/2' = '1/2',
  '1/4' = '1/4',
  full = 'full',
}

const config_bilibili = {
  biliVideoDansFromBiliEvaolved: config({
    defaultValue: false,
    label: '使用bilibili-evaolved获取b站视频弹幕',
    desc: '该模式有问题没法下载完全的弹幕',
  }),
  biliVideoPakkuFilter: config({
    defaultValue: true,
    label: 'b站视频弹幕使用pakku.js过滤',
    desc: '只有bilibili-evaolved模式开了才能用。目前只有过滤+减少弹幕，原始json文件一屏弹幕量会非常多，没有特殊功能',
    relateBy: 'biliVideoDansFromBiliEvaolved',
    relateByValue: true,
  }),

  biliLiveSide: config({
    defaultValue: false,
    label: 'b站直播侧边栏',
    desc: '实验性功能，同时需要切换[新版画中画播放模式]-[双视频模式]模式',
  }),
}

export default config_bilibili
