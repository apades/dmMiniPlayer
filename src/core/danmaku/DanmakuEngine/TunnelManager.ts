import { DanmakuEngine, DanmakuBase, DanmakuMoveType } from '.'

export default class TunnelManager {
  tunnelsMap: { [key in DanmakuMoveType]: DanmakuBase[] }
  maxTunnel = 100

  constructor(public danmakuEngine: DanmakuEngine) {
    this.resetTunnelsMap()
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
  }
}
