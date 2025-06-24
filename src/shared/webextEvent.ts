enum WebextEvent {
  /**用bg fetch数据，可以携带对应url域下的cookie */
  bgFetch = 'bgFetch',
  /**开始获取弹幕，然后监听getDanmaku里返回弹幕 */
  setGetDanmaku = 'setGetDanmaku',
  getDanmaku = 'getDanmaku',
  stopGetDanmaku = 'stopGetDanmaku',
  needClickWebToOpenPIP = 'needClickWebToOpenPIP',
  startTabCapture = 'startTabCapture',
  /**让bg起来 */
  getup = 'getup',
  getTabCapturePermission = 'getTabCapturePermission',
  requestVideoPIP = 'requestVideoPIP',
  openSetting = 'openSetting',

  moveDocPIPPos = 'moveDocPIPPos',
  resizeDocPIP = 'resizeDocPIP',
  updateDocPIPRect = 'updateDocPIPRect',

  beforeStartPIP = 'beforeStartPIP',
  afterStartPIP = 'afterStartPIP',
  closePIP = 'closePIP',

  reloadPage = 'reloadPage',
}

export default WebextEvent
