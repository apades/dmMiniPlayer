import { ATTR_DISABLE, ATTR_LOADED, ATTR_URL } from '@root/shared/config'

export const onExtLoaded = (
  callback: (data: { extBaseUrl: string }) => void,
) => {
  const extBaseUrl = document.documentElement.getAttribute(ATTR_URL)!
  if (document.documentElement.getAttribute(ATTR_DISABLE)) return
  const observer = new MutationObserver(() => {
    if (!document.documentElement.getAttribute(ATTR_LOADED)) return
    if (document.documentElement.getAttribute(ATTR_DISABLE))
      return observer.disconnect()

    callback({ extBaseUrl })
    observer.disconnect()
  })

  observer.observe(document.documentElement, {
    attributes: true,
  })
}
