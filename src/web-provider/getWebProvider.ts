import BilibiliLiveProvider from './bilibili/live'
import BilibiliVideoProvider from './bilibili/video'
import CommonProvider from './common'
import DdrkProvider from './ddrk'
import DouyinProvider from './douyin'
import DonghuafengProvider from './donghuafeng'
import DouyuLiveProvider from './douyu'
import TwitchProvider from './twitch'
import YoutubeProvider from './youtube'
import { WebProvider } from '@root/core/WebProvider'
import { getProviderConfig } from '@root/shared/providerConfig'

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
    default:
      return new CommonProvider()
  }
}
