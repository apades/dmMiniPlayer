export const mv3MoveTabsToPosition = (
  tab: chrome.tabs.Tab,
  position: [number, number],
) => {
  return chrome.windows.update(tab.windowId, {
    left: position[0],
    top: position[1],
  })
}

const sensitive = 3
export const mv3GetDocPIPTab = (
  /**chrome系统页和docPIP属性都一样的，只能通过width判断了 */
  width: number,
) => {
  return chrome.tabs.query({ active: true }).then((tabs) => {
    console.log('tabs', tabs, width)
    // 😅莫名其妙的实际width会少1
    return tabs.find(
      (tab) =>
        (tab.width ?? 0) + sensitive >= width &&
        (tab.width ?? 0) <= width + sensitive,
    )
  })
}
