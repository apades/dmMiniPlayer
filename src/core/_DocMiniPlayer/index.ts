import configStore, { DocPIPRenderType } from '@root/store/config'
import { observe } from 'mobx'
import { type MiniPlayerProps } from '../miniPlayer'
import BaseDocMiniPlayer from './Base'
import DocMiniPlayer_OVP_Cs from './OVP_Cs'
import DocMiniPlayer_ReactVP_Cs from './ReactVP_Cs'
import DocMiniPlayer_ReactVP_canvasCs from './ReactVP_canvasCs'
import DocMiniPlayer_ReactVP_webVideo from './ReactVP_webVideo'

export default class DocMiniPlayer extends BaseDocMiniPlayer {
  constructor(props: MiniPlayerProps) {
    super(props)
    // ? 那我的切换配置还要刷新网页了？
    // 不然就是在getProvider那observe
    const docPlayer = this.getDocMiniPlayer(props)
    Object.assign(this, docPlayer)

    observe(configStore.docPIP_renderType, () => {
      const docPlayer = this.getDocMiniPlayer(props)
      Object.assign(this, docPlayer)
    })
  }
  private getDocMiniPlayer(props: MiniPlayerProps) {
    switch (configStore.docPIP_renderType) {
      case DocPIPRenderType.reactVP_canvasCs: {
        return new DocMiniPlayer_ReactVP_canvasCs(props)
      }
      case DocPIPRenderType.oVP_cs: {
        return new DocMiniPlayer_OVP_Cs(props)
      }
      case DocPIPRenderType.reactVP_cs: {
        return new DocMiniPlayer_ReactVP_Cs(props)
      }
      case DocPIPRenderType.reactVP_webVideo: {
        return new DocMiniPlayer_ReactVP_webVideo(props)
      }
      default: {
        return new BaseDocMiniPlayer(props)
      }
    }
  }
}
