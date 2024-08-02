// 这里都是保留process.env来打包chat-gpt cs，用户cs，bg的环境变量区分
const isBG = /* process.env.isBG */ true
enum TabId {
  bg = 1,
  user = 2,
}
const _env = {
  /**background 的tabId为1，用户webview的tabId为2 */
  tabId: (isBG ? +TabId.bg : TabId.user) as TabId,
  baseURLInGetURL: process.env.baseURLInGetURL,
  platform: process.env.platform,
  isBG,
}

window._env = _env

export default _env
