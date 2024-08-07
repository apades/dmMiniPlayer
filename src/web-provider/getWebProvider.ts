import BilibiliLiveProvider from './bilibili/live'
import BilibiliVideoProvider from './bilibili/video'
import CCLiveProvider from './cc'
import CommonProvider from './common'
import DdrkProvider from './ddrk'
import DouyinProvider from './douyin'
import DonghuafengProvider from './donghuafeng'
import DouyuLiveProvider from './douyu'
import TwitchProvider from './twitch'
import YoutubeProvider from './youtube'
import { WebProvider } from '@root/core/WebProvider'

const providerList = [
  {
    reg: /https:\/\/www.bilibili.com\/video\/.*/,
    provider: BilibiliVideoProvider,
  },
  {
    reg: /https:\/\/www.bilibili.com\/list\/.*/,
    provider: BilibiliVideoProvider,
  },
  {
    reg: /https:\/\/www.bilibili.com\/bangumi\/.*/,
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
  {
    reg: /https:\/\/ddys\.(art|pro)\/.*/,
    provider: DdrkProvider,
  },
  {
    reg: /https:\/\/live\.douyin\.com\/.*/,
    provider: DouyinProvider,
  },
  {
    reg: /https:\/\/ani\.gamer\.com\.tw\/.*/,
    provider: DonghuafengProvider,
  },
  {
    reg: /https:\/\/www\.twitch\.tv\/.*/,
    provider: TwitchProvider,
  },
  {
    reg: /https:\/\/www\.youtube\.com\/.*/,
    provider: YoutubeProvider,
  },
  {
    reg: /.*/,
    provider: CommonProvider,
  },
]

export default function getWebProvider<T extends WebProvider>(): T | null {
  let provider = providerList.find(({ provider, reg }) => {
    if (reg.test(location.href)) return provider
  })

  if (provider) return new provider.provider() as any
  return null
}
