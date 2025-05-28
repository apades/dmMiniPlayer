import type { WebProvider } from '@root/core/WebProvider'
import { getProviderConfig } from '@root/shared/providerConfig'
import BilibiliLiveProvider from './bilibili/live'
import BilibiliVideoProvider from './bilibili/video'
import CommonProvider from './common'
import DdrkProvider from './ddrk'
import DonghuafengProvider from './donghuafeng'
import DouyinProvider from './douyin'
import DouyuLiveProvider from './douyu'
import HuyaProvider from './huya'
import TwitchProvider from './twitch'
import YoutubeProvider from './youtube'

export default function getWebProvider(): WebProvider {
  const providerKey = getProviderConfig(location.href)

  switch (providerKey) {
    case 'bilibili-live':
      return new BilibiliLiveProvider()
    case 'bilibili-video':
      return new BilibiliVideoProvider()
    case 'douyu':
      return new DouyuLiveProvider()
    case 'ddrk':
      return new DdrkProvider()
    case 'douyin':
      return new DouyinProvider()
    case 'donghuafeng':
      return new DonghuafengProvider()
    case 'twitch':
      return new TwitchProvider()
    case 'youtube':
      return new YoutubeProvider()
    case 'huya':
      return new HuyaProvider()
    default:
      return new CommonProvider()
  }
}
