# @apad/element-picker

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

- `start()` 开始鼠标选取，`Esc` 结束选取
- `list` 模式：左键提取当前 DOM 特征并选中同类节点；右键点中已多选出的多余 DOM，去掉其特征后重新匹配
- `elements` / `features` / `cssSelector` 可随时读取当前结果

```bash
pnpm playground        # http://localhost:5174
pnpm playground:build  # GitHub Pages 静态资源
pnpm test
```
