import { getProviderConfig } from '@root/shared/providerConfig'
import BilibiliVideo from './apiDanmaku/bilibili/BilibiliVideo'
import { Props } from './DanmakuGetter'
import BilibiliLive from './apiDanmaku/bilibili/BilibiliLive'

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
