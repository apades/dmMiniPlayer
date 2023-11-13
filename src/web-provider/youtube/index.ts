import { dq1 } from '@root/utils'
import WebProvider from '../webProvider'
import YoutubeLiveProvider from './live'
import CommonProvider from '../common'

export default class YoutubeProvider extends WebProvider {
  constructor(...props: ConstructorParameters<typeof WebProvider>) {
    if (dq1('.ytd-live-chat-frame')) return new YoutubeLiveProvider(...props)
    super()
    return new CommonProvider(...props)
  }
}
