import MiniPlayer from '@root/miniPlayer'

export default abstract class WebProvider {
  miniPlayer: MiniPlayer
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
