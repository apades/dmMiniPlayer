import Resources from './resources'

/**
 * 设置值
 * @alias Helper.setValue
 * @param {*} value - 值
 * @param {*} defaultValue - 默认值
 * @param {string} type - 类型
 * @returns {*} - 值
 */
function setValue(value, defaultValue, type) {
  let returnValue
  if (isEmpty(value)) returnValue = clone(defaultValue)
  else returnValue = clone(value)
  if (!isEmpty(type)) checkType(returnValue, type)
  else if (!isEmpty(defaultValue)) checkType(returnValue, _typeof(defaultValue))
  return returnValue
}

/**
 * 设置多个值
 * @alias Helper.setValues
 * @param {object} values - 值
 * @param {object} defaultValues - 默认值
 * @param {object} types - 类型
 * @returns {object} - 值
 */
function setValues(values, defaultValues, types, clone = true) {
  let returnValues = clone ? setValue(values, {}) : defaultValues
  let _values = clone ? returnValues : setValue(values, {})
  for (let key in defaultValues) {
    if (_typeof(defaultValues[key]) === 'object')
      returnValues[key] = setValues(
        _values[key],
        defaultValues[key],
        types[key],
      )
    else
      returnValues[key] = setValue(_values[key], defaultValues[key], types[key])
  }
  return returnValues
}

/**
 * 检查类型
 * @alias Helper.checkType
 * @param {string} value - 值
 * @param {string} type - 类型
 * @param {boolean} canBeNull - 可以为空
 */
function checkType(value, type, canBeNull = true) {
  if (typeof type != 'string' && _typeof(type) != 'array')
    throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
  if (canBeNull && isEmpty(value)) return
  if (_typeof(type) === 'array') {
    let flat = false
    for (let item of type) {
      if (typeof item != 'string')
        throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
      if (_typeof(value) === item) {
        flat = true
        break
      }
    }
    if (!flat) throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
  } else if (_typeof(value) != type)
    throw new TypeError(Resources.PARAMETERS_TYPE_ERROR)
}

/**
 * 检查多个值
 * @alias Helper.checkTypes
 * @param {object} values - 值
 * @param {object} types - 类型
 * @returns {object} - 值
 */
function checkTypes(values, types, canBeNull = true) {
  if (canBeNull && isEmpty(values)) return
  for (let key in types) {
    if (_typeof(types[key]) === 'object') checkTypes(values[key], types[key])
    else checkType(values[key], types[key], canBeNull)
  }
}

/**
 * 检查是否为空
 * @alias Helper.isEmpty
 * @param {*} value - 值
 */
function isEmpty(value) {
  return (
    typeof value === 'undefined' ||
    (typeof value === 'number' && isNaN(value)) ||
    value === null
  )
}

/**
 * 获取对象的类型（可区分数组等）
 * @alias Helper._typeof
 * @param {*} object - 对象
 */
function _typeof(object) {
  //eg: [Object Function] -> Function -> function
  return Object.prototype.toString.call(object).slice(8, -1).toLowerCase()
}

/**
 * 克隆对象
 * @param {*} object
 */
function clone(object) {
  let result,
    type = _typeof(object)
  //确定result的类型
  if (type === 'object') result = {}
  else if (type === 'array') result = []
  else return object
  for (let key in object) {
    result[key] = clone(object[key]) //递归调用
  }
  return result
}

/**
 * 清空元素
 * @param {Element} element
 */
function cleanElement(element) {
  let lastChild
  while ((lastChild = element.lastChild) != null) element.removeChild(lastChild)
}

/**
 * 获取屏幕的设备像素比
 * @param {boolean} showWarn - 显示警告
 */
function getDevicePixelRatio(showWarn = false) {
  if (typeof window.devicePixelRatio === 'number')
    return window.devicePixelRatio
  if (
    typeof window.screen.deviceXDPI === 'number' &&
    typeof window.screen.logicalXDPI === 'number'
  )
    return screen.deviceXDPI / screen.logicalXDPI
  //不支持 devicePixelRatio 的警告
  if (showWarn) console.warn(Resources.DEVICEPIXELRATIO_NOT_SUPPORT_WARN)
  return 1
}

/**
 * 浅比较
 * @param {*} objectA - 对象A
 * @param {*} objectB - 对象B
 * @returns {bool} - 相等为 true，不等为 false
 */
function shallowEqual(objectA, objectB) {
  if (objectA === objectB) return true
  if (typeof objectA === 'object' && typeof objectB === 'object') {
    for (let key in objectA)
      if (!shallowEqual(objectA[key], objectB[key])) return false
    return true
  }
  return false
}

/**
 * 帮助对象
 * @namespace
 */
const Helper = {
  setValue: setValue,
  setValues: setValues,
  checkType: checkType,
  checkTypes: checkTypes,
  isEmpty: isEmpty,
  _typeof: _typeof,
  clone: clone,
  cleanElement: cleanElement,
  getDevicePixelRatio: getDevicePixelRatio,
  shallowEqual: shallowEqual,
}
export default Helper
