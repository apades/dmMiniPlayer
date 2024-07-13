export { default as DanmakuEngine } from './DanmakuEngine'
export { default as DanmakuBase } from './DanmakuBase'
export { default as TunnelManager } from './TunnelManager'

import _CanvasDanmakuEngine from './canvasDanmaku/CanvasDanmakuEngine'
import _HtmlDanmakuEngine from './htmlDanmaku/HtmlDanmakuEngine'
export class CanvasDanmakuEngine extends _CanvasDanmakuEngine {}
export class HtmlDanmakuEngine extends _HtmlDanmakuEngine {}

import _CanvasDanmaku from './canvasDanmaku/CanvasDanmaku'
import _HtmlDanmaku from './htmlDanmaku/HtmlDanmaku'
export class CanvasDanmaku extends _CanvasDanmaku {}
export class HtmlDanmaku extends _HtmlDanmaku {}

export * from './types'
