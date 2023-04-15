import BilibiliVideoProvider from './bilibili/video'
import WebProvider from './webProvider'

const providerList = [BilibiliVideoProvider]
export function getWebProvider(): WebProvider {
  // let provider = providerList.find((provider) => {
  //   if (provider.regExp.test(location.href)) return provider
  // })

  // if (provider) return new provider()
  return new BilibiliVideoProvider()
  return null
}
