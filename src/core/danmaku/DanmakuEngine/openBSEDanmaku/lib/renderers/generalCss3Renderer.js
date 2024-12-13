import GeneralBaseRenderer from './generalBaseRenderer'
import BrowserNotSupportError from '../errors/browserNotSupportError'
import Helper from '../lib/helper'

/**
 * CSS3 渲染器类
 */
class GeneralCss3Renderer extends GeneralBaseRenderer {
  /**
   * 实例化一个 CSS3 渲染器类
   * @param {object} element - Element 元素
   * @param {openBSE~Options} options - 全局选项
   * @param {object} elementSize - 元素大小
   * @param {Event} eventTrigger - 事件引发方法
   * @throws {openBSE.BrowserNotSupportError} 浏览器不支持特定渲染模式时引发错误
   */
  constructor(element, options, elementSize, eventTrigger) {
    supportCheck() //浏览器支持检测
    let _div = init()
    super(_div, options, elementSize)

    /**
     * 清除屏幕内容
     * @override
     */
    this.cleanScreen = function () {
      Helper.cleanElement(_div)
    }

    /**
     * 绘制函数
     * @override
     */
    this.draw = function () {
      for (let bulletScreenDiv of _div.getElementsByTagName('div')) {
        if (typeof bulletScreenDiv.realTimeBulletScreen != 'object') continue
        if (this.checkWhetherHide(bulletScreenDiv.realTimeBulletScreen)) {
          bulletScreenDiv.style.visibility = 'hidden'
          continue
        }
        bulletScreenDiv.style.visibility = 'inherit'
        bulletScreenDiv.style.transform =
          bulletScreenDiv.style.webkitTransform =
          bulletScreenDiv.style.msTransform =
            `translate(${(bulletScreenDiv.realTimeBulletScreen.x - 4).toFixed(1)}px,${(bulletScreenDiv.realTimeBulletScreen.actualY - 4).toFixed(1)}px)`
      }
    }

    /**
     * 创建弹幕元素
     * @override
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.creatAndgetWidth = function (realTimeBulletScreen) {
      let bulletScreen = realTimeBulletScreen.bulletScreen
      let bulletScreenDiv = realTimeBulletScreen.div
        ? realTimeBulletScreen.div
        : document.createElement('div')
      bulletScreenDiv.style.position = 'absolute'
      bulletScreenDiv.style.whiteSpace = 'nowrap'
      bulletScreenDiv.style.fontWeight = bulletScreen.style.fontWeight
      bulletScreenDiv.style.fontSize = `${realTimeBulletScreen.size}px`
      bulletScreenDiv.style.fontFamily = bulletScreen.style.fontFamily
      bulletScreenDiv.style.lineHeight = `${realTimeBulletScreen.size}px`
      bulletScreenDiv.style.color = bulletScreen.style.color
      if (bulletScreen.style.shadowBlur != null)
        bulletScreenDiv.style.textShadow = `0 0 ${bulletScreen.style.shadowBlur}px black`
      if (bulletScreen.style.borderColor != null) {
        bulletScreenDiv.style.textStroke =
          bulletScreenDiv.style.webkitTextStroke = `0.5px`
        bulletScreenDiv.style.textStrokeColor =
          bulletScreenDiv.style.webkitTextStrokeColor =
            bulletScreen.style.borderColor
      }
      if (bulletScreen.style.boxColor != null) {
        bulletScreenDiv.style.padding = '3px'
        bulletScreenDiv.style.border = '1px solid'
        bulletScreenDiv.style.borderColor = bulletScreen.style.boxColor
      } else {
        bulletScreenDiv.style.padding = '4px'
      }
      Helper.cleanElement(bulletScreenDiv)
      bulletScreenDiv.appendChild(document.createTextNode(bulletScreen.text))
      bulletScreenDiv.realTimeBulletScreen = realTimeBulletScreen
      insertElement(bulletScreenDiv) //insert
      realTimeBulletScreen.width = bulletScreenDiv.clientWidth - 8 //弹幕的宽度：像素
      realTimeBulletScreen.div = bulletScreenDiv
    }

    /**
     * 删除弹幕元素
     * @override
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.delete = function (realTimeBulletScreen) {
      _div.removeChild(realTimeBulletScreen.div)
    }

    /**
     * 重新添加弹幕
     * @override
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.reCreatAndgetWidth = function (realTimeBulletScreen) {
      this.delete(realTimeBulletScreen)
      this.creatAndgetWidth(realTimeBulletScreen)
    }

    /**
     * 添加Div
     * @private
     * @returns {Element} Div
     */
    function init() {
      let div = document.createElement('div') //DIV
      Helper.cleanElement(element)
      element.appendChild(div)
      div.style.overflow = 'hidden'
      div.style.padding = '0'
      div.style.margin = '0'
      div.style.userSelect =
        div.style.webkitUserSelect =
        div.style.msUserSelect =
          'none'
      div.style.cursor = 'default'
      registerEvent(div) //注册事件响应程序
      return div
    }

    /**
     * 浏览器支持检测
     * @private
     * @throws {openBSE.BrowserNotSupportError} 浏览器不支持特定渲染模式时引发错误
     */
    function supportCheck() {
      let style = document.createElement('div').style
      if (
        typeof style.transform === 'undefined' &&
        typeof style.msTransform === 'undefined' &&
        typeof style.webkitTransform === 'undefined'
      )
        throw new BrowserNotSupportError('CSS3 transform')
    }

    /**
     * 注册事件响应程序
     * @private
     * @param {Element} element - 元素
     */
    function registerEvent(element) {
      //上下文菜单
      element.oncontextmenu = function (e) {
        if (e.target != this) {
          e.stopPropagation()
          eventTrigger('contextmenu', e.target.realTimeBulletScreen, e)
          return false
        }
      }
      //单击
      element.onclick = function (e) {
        if (e.target != this) {
          e.stopPropagation()
          eventTrigger('click', e.target.realTimeBulletScreen, e)
          return false
        }
      }
      //鼠标移动
      element.onmousemove = function (e) {
        let realTimeBulletScreen = e.target.realTimeBulletScreen
        if (e.target === this || realTimeBulletScreen.mousein) return
        realTimeBulletScreen.mousein = true
        e.target.style.cursor = options.cursorOnMouseOver
        eventTrigger('mouseenter', realTimeBulletScreen, e)
      }
      //鼠标离开
      element.onmouseout = function (e) {
        let realTimeBulletScreen = e.target.realTimeBulletScreen
        if (e.target === this || !realTimeBulletScreen.mousein) return
        realTimeBulletScreen.mousein = false
        e.target.style.cursor = ''
        eventTrigger('mouseleave', realTimeBulletScreen, e)
      }
    }

    /**
     * 按 layer 插入元素
     * @param {Element} element - 元素
     */
    function insertElement(element) {
      let elements = _div.getElementsByTagName(element.tagName)
      if (elements.length === 0) _div.appendChild(element)
      let index
      for (index = elements.length - 1; index > 0; index--) {
        let _layer = elements[index].realTimeBulletScreen.bulletScreen.layer
        if (_layer <= element.realTimeBulletScreen.bulletScreen.layer) break
      }
      if (++index === elements.length) _div.appendChild(element)
      else _div.insertBefore(element, elements[index])
    }
  }
}
export default GeneralCss3Renderer
