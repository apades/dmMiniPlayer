import BilibiliVideoProvider from './bilibili/video'
import WebProvider from './webProvider'
import BilibiliLiveProvider from './bilibili/live'

const providerList = [BilibiliVideoProvider, BilibiliLiveProvider]
console.log('providerList', providerList)
export function getWebProvider(): WebProvider {
  let provider = providerList.find((provider) => {
    if (provider.regExp.test(location.href)) return provider
  })

  if (provider) return new provider()
  // return new BilibiliVideoProvider()
  return null
}
