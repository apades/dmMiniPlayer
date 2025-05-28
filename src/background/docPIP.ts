import WebextEvent from '@root/shared/webextEvent'
import {
  mv3GetDocPIPTab,
  mv3MoveTabsToPosition,
  mv3ResizeTabs,
  mv3UpdateTab,
  setDocPIPTabId,
} from '@root/utils/mv3'
import { onMessage } from 'webext-bridge/background'

onMessage(WebextEvent.beforeStartPIP, async () => {
  // 通过将比较新旧的tab，找到docPIPTabId
  const tabs = (await chrome.tabs.query({ active: true })).filter(
    (v) => !v.favIconUrl,
  )
  const unListen = onMessage(WebextEvent.afterStartPIP, async ({ data }) => {
    const width = data.width
    const newTabs = (await chrome.tabs.query({ active: true })).filter(
      (v) => !v.favIconUrl,
    )

    const maybeDocPIPTabs = newTabs.filter((newTab) => {
      return tabs.every((tab) => newTab.id !== tab.id)
    })

    unListen()

    // width是保底出现2个及以上的tab的情况
    if (maybeDocPIPTabs.length > 1) {
      const sensitive = 3
      const tarTab = maybeDocPIPTabs.find(
        (tab) =>
          (tab.width ?? 0) + sensitive >= width &&
          (tab.width ?? 0) <= width + sensitive,
      )
      if (tarTab) {
        return setDocPIPTabId(tarTab.id)
      }
      // 还是找不到的情况？
      console.log('tabs', tabs, 'newTabs', newTabs)
      throw Error('有多个tab，但找不到docTab')
    }
    if (maybeDocPIPTabs[0]) {
      return setDocPIPTabId(maybeDocPIPTabs[0].id)
    }

    console.log('tabs', tabs, 'newTabs', newTabs)
    throw Error('找不到docTab')
  })
})

onMessage(WebextEvent.moveDocPIPPos, async ({ data }) => {
  const docPIPTab = await mv3GetDocPIPTab(data.docPIPWidth)
  console.log('docPIPTab', docPIPTab)
  if (!docPIPTab) throw Error('Not find docPIP tab')
  await mv3MoveTabsToPosition(docPIPTab, [data.x, data.y])
})

onMessage(WebextEvent.resizeDocPIP, async ({ data }) => {
  const docPIPTab = await mv3GetDocPIPTab(data.docPIPWidth)
  if (!docPIPTab) throw Error('Not find docPIP tab')
  await mv3ResizeTabs(docPIPTab, { height: data.height, width: data.width })
})

onMessage(
  WebextEvent.updateDocPIPRect,
  async ({ data: { docPIPWidth, ...data } }) => {
    const docPIPTab = await mv3GetDocPIPTab(docPIPWidth)
    if (!docPIPTab) throw Error('Not find docPIP tab')
    await mv3UpdateTab(docPIPTab, data)
  },
)

onMessage(WebextEvent.closePIP, () => {
  setDocPIPTabId(null)
})
