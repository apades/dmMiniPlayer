/*!
 * screenfull
 * v5.1.0 - 2020-12-24
 * (c) Sindre Sorhus; MIT License
 */
import './screenfull.css'
var fn = (function () {
  var val

  var fnMap = [
    [
      'requestFullscreen',
      'exitFullscreen',
      'fullscreenElement',
      'fullscreenEnabled',
      'fullscreenchange',
      'fullscreenerror',
    ],
    // New WebKit
    [
      'webkitRequestFullscreen',
      'webkitExitFullscreen',
      'webkitFullscreenElement',
      'webkitFullscreenEnabled',
      'webkitfullscreenchange',
      'webkitfullscreenerror',
    ],
    // Old WebKit
    [
      'webkitRequestFullScreen',
      'webkitCancelFullScreen',
      'webkitCurrentFullScreenElement',
      'webkitCancelFullScreen',
      'webkitfullscreenchange',
      'webkitfullscreenerror',
    ],
    [
      'mozRequestFullScreen',
      'mozCancelFullScreen',
      'mozFullScreenElement',
      'mozFullScreenEnabled',
      'mozfullscreenchange',
      'mozfullscreenerror',
    ],
    [
      'msRequestFullscreen',
      'msExitFullscreen',
      'msFullscreenElement',
      'msFullscreenEnabled',
      'MSFullscreenChange',
      'MSFullscreenError',
    ],
  ]

  var i = 0
  var l = fnMap.length
  var ret = {}

  for (; i < l; i++) {
    val = fnMap[i]
    if (val && val[1] in document) {
      for (i = 0; i < val.length; i++) {
        ret[fnMap[0][i]] = val[i]
      }
      return ret
    }
  }

  return false
})()

var eventNameMap = {
  change: fn.fullscreenchange,
  error: fn.fullscreenerror,
}

let isEnabled = !!fn
/**@type {HTMLElement} */
let _element = null

var screenfull = {
  request: function (element, options) {
    return new Promise(
      function (resolve, reject) {
        var onFullScreenEntered = function () {
          this.off('change', onFullScreenEntered)
          resolve()
        }.bind(this)

        this.on('change', onFullScreenEntered)
        // ipad/phone 的全屏
        if (!isEnabled) {
          _element = element
          _element.classList.add('origin-fullscreen')
          return new Promise((res) => {
            res()
          }).then(onFullScreenEntered)
        }

        element = element || document.documentElement

        var returnPromise = element[fn.requestFullscreen](options)

        if (returnPromise instanceof Promise) {
          returnPromise.then(onFullScreenEntered).catch(reject)
        }
      }.bind(this),
    )
  },
  exit: function () {
    return new Promise(
      function (resolve, reject) {
        if (!this.isFullscreen) {
          resolve()
          return
        }

        var onFullScreenExit = function () {
          this.off('change', onFullScreenExit)
          resolve()
        }.bind(this)

        this.on('change', onFullScreenExit)

        if (!isEnabled) {
          _element.classList.remove('origin-fullscreen')
          return new Promise((res) => {
            res()
          }).then(onFullScreenExit)
        }

        var returnPromise = document[fn.exitFullscreen]()

        if (returnPromise instanceof Promise) {
          returnPromise.then(onFullScreenExit).catch(reject)
        }
      }.bind(this),
    )
  },
  toggle: function (element, options) {
    return this.isFullscreen ? this.exit() : this.request(element, options)
  },
  onchange: function (callback) {
    this.on('change', callback)
  },
  onerror: function (callback) {
    this.on('error', callback)
  },
  on: function (event, callback) {
    var eventName = eventNameMap[event]
    if (eventName) {
      document.addEventListener(eventName, callback, false)
    }
  },
  off: function (event, callback) {
    var eventName = eventNameMap[event]
    if (eventName) {
      document.removeEventListener(eventName, callback, false)
    }
  },
  raw: fn,
  isFullscreen: false,
  element: null,
  isEnabled,
}

Object.defineProperties(screenfull, {
  isFullscreen: {
    get: function () {
      return Boolean(document[fn.fullscreenElement])
    },
  },
  element: {
    enumerable: true,
    get: function () {
      return document[fn.fullscreenElement]
    },
  },
  isEnabled: {
    enumerable: true,
    get: function () {
      // Coerce to boolean in case of old WebKit
      return Boolean(document[fn.fullscreenEnabled])
    },
  },
})

export default screenfull
