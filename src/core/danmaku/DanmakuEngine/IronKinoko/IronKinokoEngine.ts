import { autorun } from 'mobx'
import { PlayerEvent } from '@root/core/event'
import configStore from '@root/store/config'
import { MaxTunnelType } from '@root/store/config/danmaku'
import { DanmakuInitData } from '../types'
import DanmakuEngine, { DanmakuEngineInitProps } from '../DanmakuEngine'
import IronKinokoDanmakuEngine from './lib'

export default class IronKinokoEngine extends DanmakuEngine {
  engine: IronKinokoDanmakuEngine | undefined
  onInit(props: DanmakuEngineInitProps): void {
    this.engine = new IronKinokoDanmakuEngine({ ...props, speed: this.speed })

    this.unloadCallbacks.push(
      autorun(() => {
        if (!this.engine) return
        this.container.style.opacity = this.opacity.toString()
        this.engine.speed = this.speed * 5
        this.resize()
      }),
    )

    this.on2('container-resize', () => {
      this.resize()
    })
  }

  resize() {
    if (!this.engine || !this.container) return
    const container = this.container,
      width = container.offsetWidth
    switch (configStore.maxTunnel) {
      case MaxTunnelType['1/2']:
        return this.engine.resize({
          height: container.offsetHeight / 2,
          width,
        })
      case MaxTunnelType['1/4']:
        return this.engine.resize({
          height: container.offsetHeight / 4,
          width,
        })
      case MaxTunnelType.full:
        return this.engine.resize()
    }
  }

  onUnload(): void {
    const engine = this.engine
    if (!engine) return
    engine.destroy()
    this.engine = undefined
  }

  override async addDanmakus(danmakus: DanmakuInitData[]) {
    const engine = this.engine
    if (!engine) throw Error('DanmakuEngine not init')

    danmakus.forEach((d) => {
      engine.emit({
        mode: d.type === 'right' ? 'rtl' : d.type,
        text: d.text,
        time: d.time,
        style: {
          fontSize: this.fontSize + 'px',
          textShadow:
            '1px 0 1px #000,0 1px 1px #000,0 -1px 1px #000,-1px 0 1px #000',
          fontWeight: this.fontWeight + '',
          color: d.color,
          fontFamily: this.fontFamily,
        },
      })
    })
  }
}
