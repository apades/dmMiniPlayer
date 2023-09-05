interface Window {
  documentPictureInPicture: {
    window: Window
    requestWindow: (options?: {
      width: number
      height: number
    }) => Promise<Window>
    onenter: () => void
  }
  videoPlayers: {
    add(index: string | number, val: VpAction): void
    remove(index: string | number): void
    play(index: string | number): void
    list: Map<string | number, VpAction>
    /**被focus过的视频 */
    focusIndex: string | number
  }
  [k: string]: any
}

type dykey<T = any> = {
  [key: string]: T
}

declare module 'ass-parser' {
  const assParser: (text: string, option?: any) => any[]
  export default assParser
}
