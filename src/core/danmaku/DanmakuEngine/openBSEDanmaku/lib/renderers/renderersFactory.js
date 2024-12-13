import Resources from '../lib/resources'
import generalCss3Renderer from './generalCss3Renderer'

/**
 * 渲染器
 * @private @constant
 */
const RENDERERS = {
  /**
   * CSS3 渲染模式（普通弹幕引擎和特殊弹幕引擎）
   * @private @readonly
   */
  css3: {
    general: generalCss3Renderer,
  },
}

/**
 * 渲染器工厂
 */
class RenderersFactory {
  /**
   * 实例化一个渲染器工厂
   * @param {object} element - Element 元素
   * @param {openBSE~Options} options - 全局选项
   * @param {object} elementSize - 元素大小
   * @param {Event} eventTrigger - 事件引发方法
   */
  constructor(element, options, elementSize, eventTrigger) {
    /**
     * 获取渲染器
     * @param {string} renderMode - 渲染模式
     * @param {string} engineType - 引擎类型
     * @returns {BaseRenderer} 渲染器的实例
     * @throws {openBSE.BrowserNotSupportError} 浏览器不支持特定渲染模式时引发错误
     * @throws {TypeError} 传入的参数错误时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    ;(this.getRenderer = function (renderMode, engineType) {
      let renderer = RENDERERS[renderMode][engineType]
      if (typeof renderer === 'undefined')
        throw new TypeError(
          Resources.RENDER_MODE_ERROR.fillData({ renderMode: renderMode }),
        )
      return new renderer(element, options, elementSize, eventTrigger)
    }),
      /**
       * 获取普通弹幕渲染器
       * @param {string} renderMode - 渲染模式
       * @returns {BaseRenderer} 渲染器的实例
       * @throws {openBSE.BrowserNotSupportError} 浏览器不支持特定渲染模式时引发错误
       * @throws {TypeError} 传入的参数错误时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
       */
      (this.getGeneralRenderer = (renderMode) =>
        this.getRenderer(renderMode, 'general'))
    /**
     * 获取特殊弹幕渲染器
     * @param {string} renderMode - 渲染模式
     * @returns {BaseRenderer} 渲染器的实例
     * @throws {openBSE.BrowserNotSupportError} 浏览器不支持特定渲染模式时引发错误
     * @throws {TypeError} 传入的参数错误时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    this.getSpecialRenderer = (renderMode) =>
      this.getRenderer(renderMode, 'special')
  }
}
export default RenderersFactory
