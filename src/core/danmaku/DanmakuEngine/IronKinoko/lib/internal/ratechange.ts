
import Danmaku from '../danmaku'

export default function (this: Danmaku) {
  if (!this.media) return

  this.refresh()
  return this
}
