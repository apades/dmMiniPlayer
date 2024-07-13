// ! 用单独一个文件来解决循环引用问题
// 其他文件不要直接 import WebProvider from './WebProvider'
// 改成import { WebProvider } from './'
import WebProvider from './WebProvider'
import _DocWebProvider from './DocWebProvider'
import _CanvasWebProvider from './CanvasWebProvider'

// ? 为什么会这么写
// 因为vite-plugin在dev中的preserveModules设置导致单纯的 export { DocWebProvider } from './DocWebProvider'
// 会在 WebProvider.ts中被转化成 import DocWebProvider from './DocWebProvider'
// 所以需要这里处理下
export class DocWebProvider extends _DocWebProvider {}
export class CanvasWebProvider extends _CanvasWebProvider {}

export { WebProvider }
