import { objectKeys } from '@root/utils'
import { VideoPosData } from '@root/shared/postMessageEvent'
import { DocPIPRenderType } from '@root/types/config'

type PlayerConfig = {
  clear(): void
} & Partial<{
  cropTarget: CropTarget
  restrictionTarget: RestrictionTarget
  forceDocPIPRenderType: DocPIPRenderType
  posData: VideoPosData
  webRTCMediaStream: MediaStream
  topContainerEl: HTMLElement
  isFixedPos: boolean
}>

const playerConfig: PlayerConfig = {
  clear() {
    const ignores = ['clear']
    for (const key of objectKeys(playerConfig)) {
      if (ignores.includes(key)) return
      delete playerConfig[key]
    }
  },
}

export default playerConfig
