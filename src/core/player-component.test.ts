import {
  PlayerComponent,
  PlayerComponentConfigResolver,
} from './player-component'

type Props = {
  textInput: HTMLTextAreaElement | HTMLInputElement | string
  webTextInput: HTMLTextAreaElement | HTMLInputElement | string
  webSendButton: HTMLElement | string
}
// implements PlayerComponent<DanmakuSender, 'DanmakuSender'>
class DanmakuSender implements PlayerComponent<DanmakuSender> {
  declare readonly __playerComponentKey__: readonly ['setData']

  setData(props: Props) {}

  init() {}
}

class DanmakuManager implements PlayerComponent<DanmakuManager> {
  declare readonly __playerComponentKey__: readonly ['onInit', 'init']

  init() {}
  onInit() {}
}

type PlayerComponents = {
  DanmakuManager: DanmakuManager
  DanmakuSender: DanmakuSender
}

type ComponentsConfig = Partial<PlayerComponentConfigResolver<PlayerComponents>>

let config: ComponentsConfig = {
  DanmakuManager: {
    onInit() {},
    init: () => {},
  },
  DanmakuSender: {
    setData() {},
  },
}
