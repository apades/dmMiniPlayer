# 弹幕画中画播放器

<p align="center" style="margin-bottom: 0px !important;">
<img width="800" src="./docs/assets/view.png"><br/>
</p>

支持最新的画中画API功能，可以播放、发送弹幕，支持字幕，键盘控制进度，更好的画中画播放体验的浏览器插件

- [chrome商店](https://chrome.google.com/webstore/detail/%E5%BC%B9%E5%B9%95%E7%94%BB%E4%B8%AD%E7%94%BB%E6%92%AD%E6%94%BE%E5%99%A8/nahbabjlllhocabmecfjmcblchhpoclj)
- [edge商店](https://microsoftedge.microsoft.com/addons/detail/hohfhljppjpiemblilibldgppjpclfbl)
- [FAQ](https://github.com/apades/dmMiniPlayer/wiki/FAQ)

如果你有什么问题或者功能提议，请到[issues](https://github.com/apades/dmMiniPlayer/issues)里提出

## 🚀 功能
- 在画中画窗口中拖动、键盘控制进度、调整音量，调节倍速
- 弹幕播放和发送
  - bilibili视频 + 直播
  - 斗鱼直播
  - CC直播
  - 动画疯
  - youtube直播 *
  - twitch直播 *
  - 抖音直播 *
- 支持bilibili、youtube的视频自带的字幕播放
- 支持bilibili、youtube的视频播放侧边栏，可直接在画中画里切换播放列表、推荐视频
- 支持外挂.xml .ass弹幕文件，下载可以使用[Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved)或[ACG助手](https://chromewebstore.google.com/detail/kpbnombpnpcffllnianjibmpadjolanh)，也可以通过输入bilibili url的下载弹幕并播放
- 支持外挂.srt .ass字幕
- 与bilibili一样的长按右键倍速功能
- 所有https网站下的视频画中画模式

> [!NOTE]
> *标记为目前只有监听网页弹幕DOM模式，可能会有意料之外的问题

## 📚 主要实现方法
### 旧版本PIP
用一个单独canvas画video + 弹幕，再把canvas的stream附加到一个单独的video上，最后开启画中画功能

### 新版本docPIP
使用了[documentPictureInPicture](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/)该API，关于[技术细节在这](https://github.com/apades/dmMiniPlayer/wiki/tech%E2%80%90zh)

> [!NOTE]
> 该API是[非w3c草案功能](https://wicg.github.io/document-picture-in-picture/)，从chrome 116开始已经强推到stable上了，[非chromium](https://caniuse.com/?search=document-picture-in-picture)目前还没看到能用的，所以其他内核浏览器不打算支持
> 
> 如果你是360 qq浏览器这种套壳Chromium的且没有该API，地址栏到`chrome://flags/#document-picture-in-picture-api`查看是否支持开启

> [!WARNING]
> 如果你使用edge打开有红色tab栏，建议升级到`126.0.2592.102`版本以上


## 💖 引用代码
非常感谢这些项目的开源，让我抄了不少代码节省了很多时间

- [bilibili-evaolved](https://github.com/the1812/Bilibili-Evolved)
- [douyu-monitor](https://github.com/qianjiachun/douyu-monitor)
- [real-url](https://github.com/wbt5/real-url/blob/master/danmu/danmaku/cc.py)
- [bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
- [rc-slider](http://github.com/react-component/slider)
- [js-cookie](https://github.com/js-cookie/js-cookie)
- [esbuild-plugin-inline-import](https://github.com/claviska/esbuild-plugin-inline-import)
- [tsup](https://github.com/egoist/tsup/blob/796fc5030f68f929fecde7c94732e9a586ba7508/src/esbuild/postcss.ts)

## 🍔 投喂
如果您很喜欢这个项目, 欢迎打赏, 金额随意. 您的支持是我的动力(=・ω・=)

[爱发电](https://afdian.com/a/apades)
