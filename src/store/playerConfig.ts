import { objectKeys } from '@root/utils'
import { DocPIPRenderType } from './config'
import { VideoPosData } from '@root/shared/postMessageEvent'

type PlayerConfig = {
  cropTarget?: CropTarget
  restrictionTarget?: RestrictionTarget
  forceDocPIPRenderType?: DocPIPRenderType
  posData?: VideoPosData
  webRTCMediaStream?: MediaStream
  clear(): void
}
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
