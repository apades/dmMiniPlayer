import CanvasPIPWebProvider from './CanvasPIPWebProvider'
import DocPIPWebProvider from './DocPIPWebProvider'
import ReplacerWebProvider from './ReplacerWebProvider'
// ! 用单独一个文件来解决循环引用问题
// 其他文件不要直接 import WebProvider from './WebProvider'
// 改成import { WebProvider } from './'
import WebProvider from './WebProvider'
import HtmlDanmakuProvider from './htmlDanmakuProvider'

export {
  WebProvider,
  DocPIPWebProvider,
  CanvasPIPWebProvider,
  HtmlDanmakuProvider,
  ReplacerWebProvider,
}
