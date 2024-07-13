import MiniPlayer from './MiniPlayer'

export default class CanvasMiniPlayer extends MiniPlayer {
  async getPlayerEl(): Promise<HTMLElement> {
    throw new Error('Method not implemented.')
  }
  async getMediaStream(): Promise<MediaStream> {
    throw new Error('Method not implemented.')
  }
}
