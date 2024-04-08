interface Window {
  documentPictureInPicture: {
    window: Window
    requestWindow: (options?: {
      width: number
      height: number
    }) => Promise<Window>
    onenter: () => void
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

declare module '*?raw' {
  const text: string
  export default text
}

declare module '*?inline' {
  const text: string
  export default text
}

declare module '*?url' {
  const url: string
  export default url
}

declare module '@apad/setting-panel/lib/index.css' {
  const url: string
  export default url
}

type ExtMediaSessionAction = MediaSessionAction | 'enterpictureinpicture'

interface MediaSession {
  setActionHandler(
    action: ExtMediaSessionAction,
    handler: MediaSessionActionHandler | null
  ): void
}
