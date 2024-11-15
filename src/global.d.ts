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

interface DisplayMediaStreamOptions {
  preferCurrentTab?: boolean
}

interface HTMLVideoElement {
  captureStream: () => MediaStream
}

interface MediaTrackConstraints {
  mandatory?: Partial<{
    maxFrameRate: number
    chromeMediaSource: 'tab'
    chromeMediaSourceId: string | number
  }>
}

interface MediaStreamTrack {
  cropTo: (cropTarget: CropTarget) => Promise<void>
  restrictTo: (restrictTarget: RestrictionTarget) => Promise<void>
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
