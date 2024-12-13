import Resources from './resources'
import Helper from './helper'

/**
 * 事件模型类
 */
class Event {
  /**
   * 创建一个新的事件模型。
   */
  constructor() {
    /**
     * 事件列表
     * @private
     */
    let eventList = {}
    /**
     * 添加事件
     * @public
     * @param {string} name - 事件名称
     * @throws {TypeError} 传入的参数错误或事件已存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    this.add = function (name) {
      if (typeof name != 'string')
        throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
      if (typeof eventList[name] != 'undefined')
        throw new TypeError(Resources.EVENT_ALREADY_EXISTS_ERROR)
      eventList[name] = []
    }
    /**
     * 删除事件
     * @public
     * @param {string} name - 事件名称
     * @throws {TypeError} 传入的参数错误或事件不存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    this.remove = function (name) {
      if (typeof name != 'string')
        throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
      if (typeof eventList[name] === 'undefined')
        throw new TypeError(Resources.EVENT_NAME_NOT_FOUND)
      delete eventList[name]
    }
    /**
     * 绑定事件处理程序
     * @public
     * @param {string} name - 事件名称
     * @param {function} fun - 事件处理程序
     * @returns {number} 添加后的事件数
     * @throws {TypeError} 传入的参数错误或事件不存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    this.bind = function (name, fun) {
      if (typeof name != 'string' || typeof fun != 'function')
        throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
      let event = eventList[name]
      if (typeof event === 'undefined')
        throw new TypeError(Resources.EVENT_NAME_NOT_FOUND)
      for (let index in event) {
        if (event[index] === fun) return false
      }
      return event.unshift(fun)
    }
    /**
     * 解绑事件处理程序（fun为空解绑所有事件处理程序）
     * @public
     * @param {string} name - 事件名称
     * @param {function} fun - 事件处理程序
     * @returns {number} 删除后的事件数
     * @throws {TypeError} 传入的参数错误或事件不存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    this.unbind = function (name, fun) {
      if (typeof name != 'string')
        throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
      let event = eventList[name]
      if (typeof event === 'undefined')
        throw new TypeError(Resources.EVENT_NAME_NOT_FOUND)
      if (typeof fun == 'function')
        for (let index in event) {
          if (event[index] === fun) {
            event.splice(fun, 1)
            return event.length
          }
        }
      else eventList[name] = []
    }
    /**
     * 触发事件
     * @public
     * @param {string} name - 事件名称
     * @param {object} e - 事件数据
     * @throws {TypeError} 传入的参数错误或事件不存在时引发错误。请参阅 MDN [TypeError]{@link https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypeError} 。
     */
    this.trigger = function (name, e) {
      if (typeof name != 'string' || Helper._typeof(e) != 'object')
        throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
      let event = eventList[name]
      if (typeof event === 'undefined')
        throw new TypeError(Resources.EVENT_NAME_NOT_FOUND)
      e.type = name
      for (let fun of event) {
        if (!fun(e)) return
      }
      return
    }
  }
}

export default Event
