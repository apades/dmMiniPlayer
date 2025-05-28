import type { VideoPosData } from '@root/shared/postMessageEvent'
import type { DocPIPRenderType } from '@root/types/config'
import { objectKeys } from '@root/utils'

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
