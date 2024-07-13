export { default as default } from './DanmakuManager'
export { default as DanmakuManager } from './DanmakuManager'
export { default as Danmaku } from './Danmaku'
export { default as TunnelManager } from './TunnelManager'

import _CanvasDanmakuManager from './canvasDanmaku/CanvasDanmakuManager'
import _HtmlDanmakuManager from './htmlDanmaku/HtmlDanmakuManager'
export class CanvasDanmakuManager extends _CanvasDanmakuManager {}
export class HtmlDanmakuManager extends _HtmlDanmakuManager {}

import _CanvasDanmaku from './canvasDanmaku/CanvasDanmaku'
import _HtmlDanmaku from './htmlDanmaku/HtmlDanmaku'
export class CanvasDanmaku extends _CanvasDanmaku {}
export class HtmlDanmaku extends _HtmlDanmaku {}

export * from './types'
