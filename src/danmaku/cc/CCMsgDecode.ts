/* eslint-disable @typescript-eslint/ban-types */
import struct from './struct.mjs'

function ui8ToArrayBuffer(ui8: Uint8Array) {
  let buffer = new ArrayBuffer(ui8.length)
  let bytes = new Uint8Array(buffer)
  ui8.forEach((b, i) => (bytes[i] = b))
  return buffer
}
export class CCMsgDecode {
  offset = 0
  constructor(public buffer: ArrayBuffer, public ui8: Uint8Array) {}
  de_init = (t: Uint8Array) => {
    // debugger
    const r = t[this.offset]
    this.offset += 1
    const n = this.n(r)
    return n(t)
  }

  n = (e: number) => {
    let r
    if (0 <= e && e <= 127) {
      r = this.i(e)
    } else if (128 <= e && e <= 143) {
      r = this.f(e - 128, this.de_dict)
    } else if (144 <= e && e <= 159) {
      r = this.f(e - 144, this.de_list)
    } else if (160 <= e && e <= 191) {
      r = this.f(e - 160, this.de_str)
    } else if (e == 192) {
      r = this.i(null)
    } else if (e == 193) {
      r = null
    } else if (e == 194) {
      r = this.i(false)
    } else if (e == 195) {
      r = this.i(true)
    } else if (e == 202) {
      r = this.p('>f')
    } else if (e == 203) {
      r = this.p('>d')
    } else if (e == 204) {
      r = this.p('>B')
    } else if (e == 205) {
      r = this.p('>H')
    } else if (e == 206) {
      r = this.p('>I')
    } else if (e == 207) {
      r = this.p('>Q')
    } else if (e == 208) {
      r = this.p('>b')
    } else if (e == 209) {
      r = this.p('>h')
    } else if (e == 210) {
      r = this.p('>i')
    } else if (e == 211) {
      r = this.p('>q')
    } else if (e == 217) {
      r = this.o(this.p('>B'), this.de_str)
    } else if (e == 218) {
      r = this.o(this.p('>H'), this.de_str)
    } else if (e == 219) {
      r = this.o(this.p('>I'), this.de_str)
    } else if (e == 220) {
      r = this.o(this.p('>H'), this.de_list)
    } else if (e == 221) {
      r = this.o(this.p('>I'), this.de_list)
    } else if (e == 222) {
      r = this.o(this.p('>H'), this.de_dict)
    } else if (e == 223) {
      r = this.o(this.p('>I'), this.de_dict)
    } else if (224 <= e && e <= 256) {
      r = this.i(e - 256)
    }
    return r
  }

  i = (t: any) => (t: Uint8Array) => t[this.offset - 1]
  o = (t: Function, e: any) => (r: any) => e(r, t(r))
  f = (t: any, e: Function) => (r: any) => e(r, t)
  p = (fmt: string) => (t: Uint8Array) => {
    const [s] = struct(fmt).unpack_from(ui8ToArrayBuffer(t), this.offset)
    this.offset += struct(fmt).size
    return s
  }
  de_dict = (t: any, e: any) => {
    let k = new Array(e).fill('')
    let v = new Array(e).fill('')
    let f = this.de_init
    for (let r = 0; r < e; r++) {
      k[r] = f(t)
      v[r] = f(t)
    }
    let d: Record<string, any> = {}
    for (let i = 0; i < k.length; i++) {
      d[k[i]] = v[i]
    }
    return d
  }

  de_list = (t: any, e: number) => {
    let l = new Array(e).fill('')
    let n = this.de_init
    for (let i = 0; i < e; i++) {
      l[i] = n(t)
    }
    return l
  }

  de_str = (t: Uint8Array, e: any) => {
    let s = new TextDecoder('utf-8').decode(
      t.slice(this.offset, this.offset + e)
    )
    this.offset += e
    return s
  }
}
