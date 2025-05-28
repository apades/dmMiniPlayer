import { getProviderConfig } from '@root/shared/providerConfig'
import type { Props } from './DanmakuGetter'
import BilibiliLive from './apiDanmaku/bilibili/BilibiliLive'
import BilibiliVideo from './apiDanmaku/bilibili/BilibiliVideo'

export default function getDanmakuGetter(props: Props) {
  const { url } = props
  const providerKey = getProviderConfig(url)
  switch (providerKey) {
    case 'bilibili-video':
      return new BilibiliVideo(props)
    case 'bilibili-live':
      return new BilibiliLive(props)
    default:
      throw new Error('Unsupported url')
  }
}
