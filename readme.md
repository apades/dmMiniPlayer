# dmMiniPlayer

可以带弹幕的画中画播放器，且可以在播放器中发送弹幕，狠狠的摸！

目前已支持:
- [x] bilibili 视频 + 直播
- [x] 斗鱼直播
- [x] CC直播
- [ ] 抖音直播

## 主要实现方法
### 旧版本canvas版本
用一个单独canvas画video + 弹幕，再把canvas的stream附加到一个单独的video上，最后开启画中画功能

### 新版本docPIP
使用了[documentPictureInPicture](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/)该API

目前该API是[非w3c草案功能](https://wicg.github.io/document-picture-in-picture/)，从chrome 116开始已经强推到stable上了，[非chromium](https://caniuse.com/?search=document-picture-in-picture)目前还没看到能用的（如果你是360 qq浏览器这种且没有该API，地址栏到 chrome://flags/#document-picture-in-picture-api 查看是否支持开启）

*edge目前发现有红色tab是没法改的，chrome默认则是黑色的，且edge更容易崩溃卡顿*

*目前看到issue提的mac 13.6没有关闭按钮，windows是完全支持的，可能该API兼容并不是很好*

## 引用代码
非常感谢这些项目的开源省了不少时间

- [bilibili-live-ws](https://www.npmjs.com/package/bilibili-live-ws)
- [bilibili-evaolved](https://github.com/the1812/Bilibili-Evolved)
- [douyu-monitor](https://github.com/qianjiachun/douyu-monitor)
- [real-url](https://github.com/wbt5/real-url/blob/master/danmu/danmaku/cc.py)
- [bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)