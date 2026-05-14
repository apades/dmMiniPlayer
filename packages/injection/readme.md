## injection

这个文件夹里的代码都是给插件注入到网页中的代码，直接作用于网页的js上下文，非插件独立的js上下文

### 文件结构
- entry         该包的使用入口
  - client
  - inject
- modules       存放所有模块
  - xxx         代表某个模块
    - client    提供给content script用的
    - inject    注入网页js上下文