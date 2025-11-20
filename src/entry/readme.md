# 关于entry的说明和运行顺序

## 1. entry-init-ext-config

> run_at: 'document_start'
> all_frames: true

用来**加载用户设置**和**提供插件地址**的，放在document.documentElement和attr中
1. 用户设置:       包含网站是否启用插件、给inject top脚本的注入网站pip功能开关等
2. 提供插件地址:    dev模式下给inject top脚本import模块用的，实现开发时刷新网站就更新的效果

## 2. entry-inject-top

> run_at: 'document_start'
> world: 'MAIN'

只注入主top层的脚本，目前只包含
1. History API:     用来监听前端路由更改
2. 和cs的通信系统:    用来个cs层脚本通信，且可执行代码
3. eventHacker:     注入Dom、document、window的事件监听系统，可以关闭网站脚本添加的事件监听
4. netflix:         Netflix相关控件，操控网站的播放器功能

## 3. entry-inject-all-frames-top

> run_at: 'document_start'
> world: 'MAIN'
> all_frames: true

注入主top层和所有的子iframe top层，目前包含
1. 注入网站的启动pip功能
2. 注入网站的fetch功能:     用来监听网站的请求和获取响应

## 4. entry-all-frames

> run_at: 'document_end'
> all_frames: true

里面包含播放器和浮动按钮的代码，但播放器只在主top层，而浮动按钮是每层都运行。
1. 在子iframe中的浮动按钮，操作是传递消息给主top层的播放器的