import { MoveDomToDocPIPWebProvider } from '@root/core/WebProvider'

export default class NetflixProvider extends MoveDomToDocPIPWebProvider {
  getInitData(): { tarEl: HTMLElement | string } {
    return { tarEl: '#appMountPoint' }
  }
}
