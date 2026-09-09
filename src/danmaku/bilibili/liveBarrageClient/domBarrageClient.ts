import BarrageClient from '@root/core/danmaku/BarrageClient'
import { dq, dq1, dq1Adv, wait } from '@root/utils'

/** 直播间聊天列表容器的候选选择器 */
const CONTAINER_SELECTORS = [
  '#chat-items',
  '.chat-items',
  '.chat-history-list #chat-items',
]
/** 单条弹幕元素 */
const DANMAKU_ITEM_SELECTOR = '.chat-item.danmaku-item'
/** 弹幕文本所在属性 */
const DATA_DANMAKU_ATTR = 'data-danmaku'
/** 弹幕唯一 id 所在属性 */
const DATA_ID_ATTR = 'data-id_str'
/** 聊天容器查找最大重试次数 */
const MAX_ATTACH_RETRY = 30
/** 重试间隔 */
const ATTACH_RETRY_INTERVAL = 1000
/** 容器定期复查间隔 */
const CONTAINER_CHECK_INTERVAL = 5000

/** 将 rgba()/rgb() 样式颜色转换为 #rrggbb，解析失败回退 #ffffff */
function colorToHex(color: string): string {
  if (!color) return '#ffffff'
  const m = color.match(/rgba?\(([^)]+)\)/i)
  if (!m) return color.startsWith('#') ? color : '#ffffff'
  const parts = m[1]
    .split(',')
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n))
  if (parts.length < 3 || (parts.length >= 4 && parts[3] === 0))
    return '#ffffff'
  const [r, g, b] = parts
  return (
    '#' +
    [r, g, b]
      .map((n) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

/** 从聊天列表的弹幕 DOM 中解析出弹幕数据 */
function parseDanmakuItem(el: HTMLElement) {
  const text = (el.getAttribute(DATA_DANMAKU_ATTR) ?? '').trim()
  if (!text) return null
  const id = el.getAttribute(DATA_ID_ATTR) || undefined
  const imageMap: Record<
    string,
    { url: string; width: number; height: number }
  > = {}
  for (const img of dq('img', el)) {
    const alt = (img.getAttribute('alt') ?? '').trim()
    const url = img.src || img.getAttribute('src') || ''
    if (!alt || !url) continue
    imageMap[alt] = {
      url,
      width: img.naturalWidth || img.width || 20,
      height: img.naturalHeight || img.height || 20,
    }
  }
  const colorStyle =
    (dq1<HTMLElement>('.danmaku-item-right', el)?.style as any)?.color ||
    (el.style as any)?.color ||
    ''
  const color = colorStyle ? colorToHex(colorStyle) : '#ffffff'
  return { id, text, color, imageMap }
}

/**
 * B 站直播弹幕的 DOM 抓取降级方案：
 * 当 ws 弹幕不可用（如 -352 风控拿不到弹幕服务器配置）时，
 * 通过 MutationObserver 监听直播间聊天列表 DOM 来获取弹幕。
 */
export default class BilibiliLiveDomBarrageClient extends BarrageClient {
  static MAX_SEEN = 2000

  private observer?: MutationObserver
  private retryTimer?: ReturnType<typeof setTimeout>
  private closed = false
  private seenIds = new Set<string>()
  private attachedContainer?: HTMLElement

  constructor() {
    super()
    this.attach().catch((err) => {
      console.error('[dmMiniPlayer] 直播弹幕 DOM 抓取启动失败', err)
    })
  }

  private async attach(retry = 0) {
    if (this.closed) return
    const container = this.findContainer()
    if (container) {
      // 已经挂载在同一个容器上则不重复处理
      if (this.attachedContainer === container) return
      this.attachedContainer = container
      this.observe(container)
      return
    }
    if (retry >= MAX_ATTACH_RETRY) {
      console.warn('[dmMiniPlayer] 直播弹幕：始终找不到聊天容器，停止重试')
      return
    }
    await wait(ATTACH_RETRY_INTERVAL)
    this.attach(retry + 1)
  }

  private findContainer() {
    // 用 dq1Adv：直播聊天面板可能位于同源 iframe 内
    for (const selector of CONTAINER_SELECTORS) {
      const el = dq1Adv<HTMLElement>(selector)
      if (el) return el
    }
  }

  private observe(container: HTMLElement) {
    this.observer?.disconnect()
    this.observer = new MutationObserver((mutations) => {
      if (this.closed) return
      const addedNodes = mutations
        .map((m) => [...m.addedNodes])
        .flat()
        .filter((n): n is HTMLElement => n instanceof HTMLElement)
      const items: HTMLElement[] = []
      for (const node of addedNodes) {
        if (node.matches(DANMAKU_ITEM_SELECTOR)) {
          items.push(node)
          continue
        }
        items.push(...dq<HTMLElement>(DANMAKU_ITEM_SELECTOR, node))
      }
      if (!items.length) return
      for (const item of items) {
        const danmaku = parseDanmakuItem(item)
        if (!danmaku) continue
        if (danmaku.id) {
          if (this.seenIds.has(danmaku.id)) continue
          this.seenIds.add(danmaku.id)
          // 防止集合无限膨胀
          if (this.seenIds.size > BilibiliLiveDomBarrageClient.MAX_SEEN) {
            const keep = [...this.seenIds].slice(
              -Math.floor(BilibiliLiveDomBarrageClient.MAX_SEEN / 2),
            )
            this.seenIds = new Set(keep)
          }
        }
        this.emit('danmu', {
          color: danmaku.color,
          text: danmaku.text,
          imageMap: danmaku.imageMap,
        })
      }
    })
    this.observer.observe(container, { childList: true, subtree: true })
    console.log('[dmMiniPlayer] 直播弹幕：已切换到 DOM 抓取模式')
    this.scheduleContainerCheck()
  }

  /** 聊天容器可能因路由切换/换房被重建，定期复查 */
  private scheduleContainerCheck() {
    if (this.closed) return
    clearTimeout(this.retryTimer)
    this.retryTimer = setTimeout(() => {
      if (this.closed) return
      const container = this.findContainer()
      if (!container || container !== this.attachedContainer) {
        this.attachedContainer = undefined
        this.attach()
        return
      }
      this.scheduleContainerCheck()
    }, CONTAINER_CHECK_INTERVAL)
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    clearTimeout(this.retryTimer)
    this.observer?.disconnect()
    this.observer = undefined
    this.attachedContainer = undefined
  }
}
