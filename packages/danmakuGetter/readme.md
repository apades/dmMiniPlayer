# danmakuGetter
获取各个网站的弹幕，可以通过`getDanmakuGetter`获取到实现的`DanmakuGetter`子类

**需要注意，不是所有网站都支持2个模块分离。下面的模块是需要网站才能支持**
- youtube
- twitch
- douyin
## 基础抽象类
DanmakuGetter

## 方法
### new instance(props: Props)
```ts
type Props = {
  /**视频地址 */
  url: string
  /**视频地址对应的cookie */
  cookie?: string
}
```
### init        初始化，开始获取弹幕
### unload      卸载时调用
### on
```js
on('addDanmakus', (danmakus) => {
    // 处理获取到的弹幕
})
```

## ?
- 要不要可以传入无头浏览器，让后端也能获取html弹幕