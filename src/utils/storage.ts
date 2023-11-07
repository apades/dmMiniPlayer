import { Storage } from '@plasmohq/storage'

export const PIP_WINDOW_CONFIG = 'PIP_WINDOW_CONFIG'
export const extStorage = new Storage()

export type PIPWindowConfig = {
  width: number
  height: number
}
export function getPIPWindowConfig() {
  return extStorage.get<PIPWindowConfig>(PIP_WINDOW_CONFIG)
}

export function setPIPWindowConfig(config: PIPWindowConfig) {
  return extStorage.set(PIP_WINDOW_CONFIG, config)
}
