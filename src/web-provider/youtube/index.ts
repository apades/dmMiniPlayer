import { dq1 } from '@root/utils'
import WebProvider from '../webProvider'
import YoutubeLiveProvider from './live'
import YoutubeVideoProvider from './video'

export default class YoutubeProvider extends WebProvider {
  constructor(...props: ConstructorParameters<typeof WebProvider>) {
    super()
    if (dq1('.ytd-live-chat-frame')) return new YoutubeLiveProvider(...props)
    return new YoutubeVideoProvider(...props)
  }
}
