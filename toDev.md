# core
## configStore
? 要不要保留着，反正都耦合这么多地方了，以后有拆分到多个地方，也要传入一个configStore

## WebProvider
只负责网站能够提供什么，能否提供自己的弹幕、字幕、侧边信息。

需要继承开发，例如
```js
class BilibiliProvider extends WebProvider {
  // xxxx
}
```

**WebProvider 将作为用户调用的入口，提供所有有关播放的方法**

### 负责功能
- 只管网站的内容，其他一律不管
  - 只管获取对应网站的弹幕列表，传给danmakuManager
  - 只管获取对应网站的侧边信息，传给SideManager
  - 只管获取对应网站的字幕列表，传给SubtitleManager
### 暴露方法
- openPlayer: 负责打开miniPlayer的player

### 衍生子类
定义怎么打开播放器

这个在`继承时`，自动切换`prototype`成对应的衍生子类

- DocPIPWebProvider:      使用docPIP API打开播放器
- PIPWebProvider:         使用原生PIP API打开播放器
- ReplacerWebProvider:    替换 + 覆盖网站的web videoEl

## MiniPlayer
### 负责功能
创建视频播放器，根据传入的[danmakuManager, SideManager, SubtitleManager]，自动处理该显示的东西

### 暴露方法
- getPlayerEl: 返回播放器dom，不局限于video，可以是被其他div包住的播放器
- getMediaStream: 返回可以播放的`MediaStream`