let originFn = HTMLElement.prototype.attachShadow

HTMLElement.prototype.attachShadow = function () {
  return originFn.bind(this)({ mode: 'open' })
}
