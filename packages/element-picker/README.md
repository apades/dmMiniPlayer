# @apad/element-picker

[live demo](https://apades.github.io/dmMiniPlayer/element-picker)

## Options

```ts
type Selector = string | HTMLElement

type ElementPickerOptions = {
  selector?: Selector | Selector[]
  /**
   * @default 'single'
   * 未传入时：`selector` 为数组则 `list`，否则 `single`
   */
  type?: 'single' | 'list'
  /**
   * `list` 模式下监听 DOM 变化并刷新匹配列表
   * @default false
   */
  observerAllDomChange?: boolean
}
```

## 用法

传入 `selector` 时会立即高亮对应 DOM；只传入 `type` 时调用 `start()` 后用鼠标选取。

```ts
import { ElementPicker } from '@apad/element-picker'

// 高亮单个 selector（type 推断为 single）
const preview = new ElementPicker({ selector: '.player' })

// 高亮多个 selector（type 推断为 list）
const listPreview = new ElementPicker({
  selector: ['.item', document.querySelector('.card')!],
})

// 点击选取单个 DOM
const single = new ElementPicker({ type: 'single' })
single.on('select', (els) => {
  console.log(els[0], single.cssSelector)
})
single.on('confirm', ({ elements, cssSelector }) => {
  console.log(elements, cssSelector)
})
single.start()

// 点击选取一组相似 DOM；右键点多余项，清除导致多选的多余特征
const list = new ElementPicker({
  type: 'list',
  observerAllDomChange: true,
})
list.on('change', (els) => {
  console.log(els, list.cssSelector, list.features)
})
list.start()

// 结束选取 / 销毁
list.stop()
list.destroy()
```

- `start()` 开始鼠标选取；面板会显示当前 `type`、生成的 selector，以及 Confirm / Close；`list` 模式额外显示选中数量
- Confirm 触发 `confirm` 并收起 UI；Close 或 `Esc` 触发 `close` 并销毁
- 悬停高亮块右上角显示 DOM 链路 `[tag#id.class]`，从父到子；选中后链路条固定在该块上，悬停其中某一节可预览对应节点
- `list` 模式：悬停时用蓝色预高亮同类节点；左键按共同 class 或同父节点下的兄弟成组匹配（如 `dl.defs > div`）；已匹配节点不能再左键选取，已排除节点再左键可加回；没有共同特征时 selector 显示 `-`。橙色为手动点选，绿色为自动匹配；右键点多余项可去掉多余特征，若节点没有可去掉的多余特征则拦截并提示
- `elements` / `features` / `cssSelector` 可随时读取当前结果

```bash
pnpm playground        # http://localhost:5174
pnpm playground:build  # GitHub Pages 静态资源，部署在 /element-picker
pnpm test
```
