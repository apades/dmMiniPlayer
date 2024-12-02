// ! 用单独一个文件来解决循环引用问题
// 其他文件不要直接 import WebProvider from './WebProvider'
// 改成import { WebProvider } from './'
import WebProvider from './WebProvider'
import DocPIPWebProvider from './DocPIPWebProvider'
import CanvasPIPWebProvider from './CanvasPIPWebProvider'
import HtmlDanmakuProvider from './htmlDanmakuProvider'
import ReplacerWebProvider from './ReplacerWebProvider'

export {
  WebProvider,
  DocPIPWebProvider,
  CanvasPIPWebProvider,
  HtmlDanmakuProvider,
  ReplacerWebProvider,
}
