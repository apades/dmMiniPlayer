import BilibiliLiveProvider from './bilibili/live'
import BilibiliVideoProvider from './bilibili/video'
import CCLiveProvider from './cc'
import DouyuLiveProvider from './douyu'
import WebProvider from './webProvider'

const providerList = [
  {
    reg: /https:\/\/www.bilibili.com\/video\/.*/,
    provider: BilibiliVideoProvider,
  },
  {
    reg: /https:\/\/live.bilibili.com\/.*/,
    provider: BilibiliLiveProvider,
  },
  {
    reg: /https:\/\/www\.douyu\.com\/.*/,
    provider: DouyuLiveProvider,
  },
  {
    reg: /https:\/\/cc\.163\.com\/.*/,
    provider: CCLiveProvider,
  },
]

console.log('providerList', providerList)
export function getWebProvider<T extends WebProvider>(): T {
  let provider = providerList.find(({ provider, reg }) => {
    if (reg.test(location.href)) return provider
  })

  if (provider) return new provider.provider() as any
  // return new BilibiliVideoProvider()
  return null
}
