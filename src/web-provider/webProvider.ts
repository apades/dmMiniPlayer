import MiniPlayer from '@root/miniPlayer'
import BilibiliVideoProvider from './bilibili/video'

export default abstract class WebProvider {
  miniPlayer: MiniPlayer
  /**用来匹配网站的，这里放abstract只是为了提醒这个regExp必须有而且要加上static */
  abstract regExp: RegExp
  constructor() {
    this.bindToPIPEvent()
  }

  /**处理进入画中画的事件，比如复写原本网站的画中画按钮 */
  abstract bindToPIPEvent(): void | Promise<void>

  protected abstract _startPIPPlay(): void | Promise<void>

  async startPIPPlay() {
    await this._startPIPPlay()
  }
}
