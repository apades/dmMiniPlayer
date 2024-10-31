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
    add(index: string | number, val: any): void
    remove(index: string | number): void
    play(index: string | number): void
    list: Map<string | number, any>
    /**被focus过的视频 */
    focusIndex: string | number
  }
  openSettingPanel: () => void
  [k: string]: any
}

type dykey<T = any> = {
  [key: string]: T
}

declare module 'ass-parser' {
  const assParser: (text: string, option?: any) => any[]
  export default assParser
}

declare module '*.png' {
  const url: string
  export default url
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

declare namespace chrome.runtime {
  interface ManifestBase {
    content_scripts?:
      | {
          matches?: string[] | undefined
          exclude_matches?: string[] | undefined
          css?: string[] | undefined
          js?: string[] | undefined
          run_at?:
            | 'document_start'
            | 'document_end'
            | 'document_idle'
            | undefined
          all_frames?: boolean | undefined
          match_about_blank?: boolean | undefined
          include_globs?: string[] | undefined
          exclude_globs?: string[] | undefined
          world?: 'ISOLATED' | 'MAIN' | undefined
        }[]
      | undefined
  }
}
