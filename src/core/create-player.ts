import { DocPIPRenderType } from '@root/types/config'
import { WebProvider } from './WebProvider'

export function createPlayer(props: WebProvider['config']) {
  const provider = new WebProvider({ renderType: props.renderType })
  provider.initPlayer(props)

  return provider
}
