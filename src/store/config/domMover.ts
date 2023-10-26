import { config } from '@apad/setting-panel'

const category = 'domMover'
export const domMoverConfig = {
  domMover_defaultUser: config({
    defaultValue: false,
    label: '默认用网页的播放器',
    desc: '如果没有设置过选择元素，默认是用视频el往父方向找的最后一个宽高相近的el',
  }),
  domMover_copyParents: config({
    defaultValue: false,
    label: '复制父容器',
    desc: '可能有些css是有父属性相关的',
    category,
  }),
}
