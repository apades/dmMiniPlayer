import IronKinokoDanmakuEngine from './lib'
import DanmakuEngine, { DanmakuEngineInitProps } from '../DanmakuEngine'
import { DanmakuInitData } from '../types'
import { autorun } from 'mobx'
import { PlayerEvent } from '@root/core/event'

export default class IronKinokoEngine extends DanmakuEngine {
  engine: IronKinokoDanmakuEngine | undefined
  onInit(props: DanmakuEngineInitProps): void {
    // throw new Error('Method not implemented.')
    console.log('props', props)
    this.engine = new IronKinokoDanmakuEngine({ ...props, speed: this.speed })

    this.unloadCallbacks.push(
      autorun(() => {
        if (!this.engine) return
        this.engine.speed = this.speed * 5
        this.engine.opacity = this.opacity
      }),
    )

    this.on2('container-resize', () => {
      if (!this.engine) return
      this.engine.resize()
    })
  }
  onUnload(): void {
    const engine = this.engine
    if (!engine) return
    engine.destroy()
    this.engine = undefined
  }

  override addDanmakus(danmakus: DanmakuInitData[]): void {
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
        },
      })
    })
  }
}
