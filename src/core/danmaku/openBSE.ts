import type _openBSE from 'openbse'
import 'openbse/dist/openBSE.all.js'

const openBSE = window.openBSE as typeof _openBSE
export type EngineReturn = InstanceType<(typeof _openBSE)['GeneralEngine']>
export type {
  GeneralBulletScreen,
  GeneralBulletScreenStyle,
  generalOptions,
  GeneralBulletScreenEvent,
  DebugInfo,
  VersionInfo,
} from 'openbse'
export enum GeneralType {
  rightToLeft = 1,
  leftToRight = 2,
  top = 4,
  bottom = 8,
}

export default openBSE
