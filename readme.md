# dmMiniPlayer

可以带弹幕的画中画播放器，狠狠的摸！

目前已支持:
- [x] bilibili 视频 + 直播
- [x] 斗鱼直播
- [x] CC直播

## 主要实现方法
获取目标视频的HTMLElement，然后在requestAnimationFrame下用canvas的`drawImage`画每一帧画面 + 弹幕，然后从`canvas.captureStream()`拿到videoStream在附加到一个新的video HTMLElement上作为画中画播放器，最后该video HTMLElement使用`requestPictureInPicture()`方法，实现画中画弹幕播放

## 引用代码

弹幕ws连接和b站的视频弹幕处理都是抄的别的项目和npm包，非常感谢这些项目的开源省了不少时间

[b站直播ws bilibili-live-ws](https://www.npmjs.com/package/bilibili-live-ws)

### b站视频弹幕 bilibili-evaolved

[项目地址](https://github.com/the1812/Bilibili-Evolved)

[抄的弹幕下载组件](https://github.com/the1812/Bilibili-Evolved/tree/900b6c1f6137d0a52c34afc5b63ea1a99efe5c29/registry/lib/components/video/danmaku)

### 斗鱼直播ws douyu-monitor

[项目地址](https://github.com/qianjiachun/douyu-monitor)

[抄的ws连接](https://github.com/qianjiachun/douyu-monitor/tree/main/remix/app/utils)

### cc直播ws real-url

[项目地址](https://github.com/wbt5/real-url)

[改的py版ws连接](https://github.com/wbt5/real-url/blob/master/danmu/danmaku/cc.py)