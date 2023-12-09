import Side from '@root/components/VideoPlayer/Side'
import type WebProvider from './webProvider'

const CommonSide = (webProvider: WebProvider) => () =>
  <Side webProvider={webProvider} />

export default CommonSide
