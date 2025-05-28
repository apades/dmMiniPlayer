import type { openSettingPanel } from '@root/store/config'
import type { WebProvider } from './core/WebProvider'
import type { Language } from './utils/i18n'

declare module 'react' {
  interface CSSProperties {
    [CSSCustomPropertiesKey: `--${string}`]: string | number
  }
}

declare global {
  interface CropTarget {}

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
    openSettingPanel: typeof openSettingPanel
    __LOCALE: Language
    provider?: WebProvider

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
