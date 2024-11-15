import { Language } from './utils/i18n'

declare module 'react' {
  interface CSSProperties {
    [CSSCustomPropertiesKey: `--${string}`]: string | number
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CropTarget {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface RestrictionTarget {}
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
    __LOCALE: Language

    // RestrictionTarget: {
    //   fromElement: (el: HTMLElement) => RestrictionTarget
    // }
    [k: string]: any
  }

  const RestrictionTarget: {
    fromElement: (el: HTMLElement) => Promise<RestrictionTarget>
  }
  const CropTarget: {
    fromElement: (el: HTMLElement) => Promise<CropTarget>
  }
}

export {}
