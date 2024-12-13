/**
 * 渲染器抽象类
 */
class GeneralBaseRenderer {
  /**
   * 实例化一个渲染器抽象类
   * @param {object} element - Element 元素
   * @param {openBSE~Options} options - 全局选项
   * @param {object} elementSize - 元素大小
   */
  constructor(element, options, elementSize) {
    if (new.target === GeneralBaseRenderer) {
      throw new SyntaxError()
    }

    init() //初始化

    /**
     * 隐藏弹幕
     * @private @type {boolean}
     */
    let _hide = false

    /**
     * 透明度
     * @private @type {number}
     */
    let _opacity = 0.0

    /**
     * 清除屏幕内容
     * @abstract
     */
    this.cleanScreen = function () {
      throw new SyntaxError()
    }

    /**
     * 隐藏弹幕。
     */
    this.hide = function () {
      _hide = true
      element.style.visibility = 'hidden'
    }

    /**
     * 显示弹幕。
     */
    this.show = function () {
      _hide = false
      element.style.visibility = ''
    }

    /**
     * 设置弹幕不透明度。
     */
    this.setOpacity = _setOpacity

    /**
     * 设置弹幕不透明度。
     */
    function _setOpacity() {
      if (options.opacity === 1) element.style.opacity = ''
      else element.style.opacity = options.opacity
    }

    /**
     * 获取弹幕不透明度。
     * @returns {number} 弹幕不透明度：取值范围 0.0 到 1.0，0.0 全透明；1.0 不透明。
     */
    this.getOpacity = () => _opacity

    /**
     * 获取弹幕可见性。
     * @returns {boolean} 指示弹幕是否可见。
     * @description 获取弹幕可见性。
     */
    this.getVisibility = () => !_hide

    /**
     * 绘制函数
     * @abstract
     */
    this.draw = function () {
      throw new SyntaxError()
    }

    /**
     * 创建弹幕元素
     * @abstract
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.creatAndgetWidth = function (realTimeBulletScreen) {
      throw new SyntaxError()
    }

    /**
     * 删除弹幕元素
     * @abstract
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.delete = function (realTimeBulletScreen) {
      throw new SyntaxError()
    }

    /**
     * 重新添加弹幕
     * @abstract
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.reCreatAndgetWidth = function (realTimeBulletScreen) {
      throw new SyntaxError()
    }

    /**
     * 检查弹幕是否被隐藏
     * @param {object} realTimeBulletScreen - 实时弹幕对象
     */
    this.checkWhetherHide = (realTimeBulletScreen) =>
      (realTimeBulletScreen.bulletScreen.type & options.hiddenTypes) ===
      realTimeBulletScreen.bulletScreen.type

    /**
     * 设置尺寸
     * @function
     */
    this.setSize = setSize

    /**
     * 设置尺寸
     * @private
     */
    function setSize() {
      element.style.width = `${elementSize.width}px`
      element.style.height = `${elementSize.height}px`
      if (options.scaling != 1) {
        element.style.transform =
          element.style.webkitTransform =
          element.style.msTransform =
            `scale(${options.scaling},${options.scaling})`
        element.style.transformOrigin =
          element.style.webkitTransformOrigin =
          element.style.msTransformOrigin =
            `left top`
      } else {
        element.style.transform =
          element.style.webkitTransform =
          element.style.msTransform =
          element.style.transformOrigin =
          element.style.webkitTransformOrigin =
          element.style.msTransformOrigin =
            ''
      }
    }

    /**
     * 初始化
     * @private
     */
    function init() {
      setSize()
      _setOpacity()
      element.style.position = 'relative'
    }
  }
}
export default GeneralBaseRenderer
