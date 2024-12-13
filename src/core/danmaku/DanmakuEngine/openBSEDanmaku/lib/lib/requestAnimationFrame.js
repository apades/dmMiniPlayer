/**
 * performance_now 定义（一些老式浏览器不支持 performance.now ）
 * @param {function} fun - 回调方法
 * @function
 */
let performance_now

/**
 * requestAnimationFrame 定义（一些老式浏览器不支持 requestAnimationFrame ）
 * @param {function} fun - 回调方法
 * @function
 */
let requestAnimationFrame

/**
 * cancelAnimationFrame 定义（一些老式浏览器不支持 cancelAnimationFrame ）
 * @param {function} fun - 回调方法
 * @function
 */
let cancelAnimationFrame

if (
  typeof window.performance === 'object' &&
  typeof window.performance.now === 'function'
) {
  performance_now = () => window.performance.now()
} else {
  console.warn(Resources.PREFORMANCENOW_NOT_SUPPORT_WARN)
  performance_now = () => new window.Date().getTime()
}

if (
  typeof window.requestAnimationFrame === 'function' &&
  typeof window.cancelAnimationFrame === 'function'
) {
  requestAnimationFrame = window.requestAnimationFrame
  cancelAnimationFrame = window.cancelAnimationFrame
} else {
  console.warn(Resources.REQUESTANIMATIONFRAME_NOT_SUPPORT_WARN)
  requestAnimationFrame = (callback) =>
    window.setTimeout(() => {
      callback(performance_now())
    }, 17) //60fps
  cancelAnimationFrame = (handle) => window.clearTimeout(handle)
}

export { requestAnimationFrame, cancelAnimationFrame, performance_now }
