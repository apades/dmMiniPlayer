// 字幕在 ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks里
// 每一个结构
const captionTrack = {
  baseUrl:
    'https://www.youtube.com/api/timedtext?v=obsbr57gB6w\u0026ei=e82UZaj0C_bfs8IPhIeG-AE\u0026opi=112496729\u0026xoaf=5\u0026hl=zh-CN\u0026ip=0.0.0.0\u0026ipbits=0\u0026expire=1704275947\u0026sparams=ip,ipbits,expire,v,ei,opi,xoaf\u0026signature=043A7F8349196E6C6C7BFD00730894C6C2BEDC61.2750A7A398AB224D6CFB59000CA009374E5AB067\u0026key=yt8\u0026lang=ja',
  name: {
    simpleText: '日语',
  },
  vssId: '.ja',
  languageCode: 'ja',
  isTranslatable: true,
  trackName: '',
}

// 这个可以获取和youtube使用相同的结构字幕文件
const url = captionTrack.baseUrl + '&fmt=json3&xorb=2&xobt=3&xovt=3'
// html提取 /ytInitialPlayerResponse = \{(.*)\};/
