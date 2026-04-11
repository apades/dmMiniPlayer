import { WebProvider } from '@root/core/WebProvider'
import { getProviderConfig } from '@root/shared/providerConfig'
import BilibiliLiveProvider from './bilibili/live'
import BilibiliVideoProvider from './bilibili/video'
import CommonProvider from './common'
import DdrkProvider from './ddrk'
import DouyinProvider from './douyin'
import DonghuafengProvider from './donghuafeng'
import DouyuLiveProvider from './douyu'
import TwitchProvider from './twitch'
import YoutubeProvider from './youtube'
import HuyaProvider from './huya'
import NetflixProvider from './netflix'

export default function getWebProvider(
  props: ConstructorParameters<typeof WebProvider>[0],
): WebProvider {
  const providerKey = getProviderConfig(location.href)

  const provider = (() => {
    switch (providerKey) {
      case 'bilibili-live':
        return BilibiliLiveProvider
      case 'bilibili-video':
        return BilibiliVideoProvider
      case 'douyu':
        return DouyuLiveProvider
      case 'ddrk':
        return DdrkProvider
      case 'douyin':
        return DouyinProvider
      case 'donghuafeng':
        return DonghuafengProvider
      case 'twitch':
        return TwitchProvider
      case 'youtube':
        return YoutubeProvider
      case 'huya':
        return HuyaProvider
      case 'netflix':
        return NetflixProvider
      default:
        return CommonProvider
    }
  })()

  return new provider(props)
}
