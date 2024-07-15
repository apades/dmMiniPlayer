import configStore from '@root/store/config'
import { MaxTunnelType } from '@root/store/config/danmaku'
import { autorun } from 'mobx'
import { DanmakuBase, DanmakuEngine, DanmakuMoveType } from '.'

export default class TunnelManager {
  tunnelsMap: { [key in DanmakuMoveType]: (DanmakuBase | null)[] } = {
    bottom: [],
    top: [],
    right: [],
  }
  maxTunnel = 100

  private listens: (() => void)[] = []
  constructor(public danmakuEngine: DanmakuEngine) {
    this.resetTunnelsMap()
    this.listens = [
      // 设置最大行数
      autorun(() => {
        const { maxTunnel, gap } = configStore
        const renderHeight = this.danmakuEngine.containerHeight
        const fontSize = this.danmakuEngine.fontSize

        this.maxTunnel = (() => {
          switch (maxTunnel) {
            case MaxTunnelType['1/2']:
              return renderHeight / 2 / (+fontSize + +gap)
            case MaxTunnelType['1/4']:
              return renderHeight / 4 / (+fontSize + +gap)
            case MaxTunnelType['full']:
              return 100
          }
        })()
      }),
    ]
  }

  private _getTunnel(danmaku: DanmakuBase) {
    const type = danmaku.type
    // 先找有没有空位
    const emptyIndex = this.tunnelsMap[type].findIndex((v) => !v)
    if (emptyIndex != -1) {
      this.tunnelsMap[type][emptyIndex] = danmaku
      return emptyIndex > this.maxTunnel ? -1 : emptyIndex
    }
    // 检查是否到最大限制
    if (this.tunnelsMap[type].length > this.maxTunnel) {
      return -1
    }
    // 没有空位就创建一个新的位置
    this.tunnelsMap[type].push(danmaku)
    return this.tunnelsMap[type].length - 1
  }
  getTunnel(danmaku: DanmakuBase) {
    const type = danmaku.type
    const rsTunnel = this._getTunnel(danmaku)
    return rsTunnel
  }
  /**@deprecated */
  pushTunnel(danmaku: DanmakuBase) {
    const type = danmaku.type
    const emptyIndex = this.tunnelsMap[type].findIndex((v) => !v)
    if (emptyIndex != -1) {
      this.tunnelsMap[type][emptyIndex] = danmaku
      return
    }
    this.tunnelsMap[type].push(danmaku)
  }
  popTunnel(danmaku: DanmakuBase) {
    const { type, tunnel } = danmaku
    // 解决resize时的问题
    // ! 可能容易出问题这里
    // if (danmaku != this.tunnelsMap[type][tunnel]) return false
    this.tunnelsMap[type][tunnel] = null
    return true
  }

  resetTunnelsMap() {
    this.tunnelsMap = {
      bottom: [],
      right: [],
      top: [],
    }
  }

  unload() {
    this.resetTunnelsMap()
    this.listens.forEach((v) => v())
  }
}
