import { v1 as uuid } from 'uuid'
import struct from './struct.mjs'
import {
  isArray,
  isNumber,
  isObject,
  isString,
  onceCall,
  wait,
} from '@root/utils'
import { CCMsgDecode } from './CCMsgDecode'
import pako from 'pako'
import type { DanType } from '..'

export function bytes(b: number[] | string): ArrayBuffer {
  if (isArray(b)) {
    let buffer = new ArrayBuffer(b.length)
    let bytes = new Uint8Array(buffer)
    b.forEach((b, i) => (bytes[i] = b))
    return buffer
  }
  const encoder = new TextEncoder()
  const arrayBuffer = encoder.encode(b)
  return arrayBuffer.buffer
}

function combineArrayBuffer(...arrays: ArrayBuffer[]) {
  let totalLen = 0

  for (let arr of arrays) totalLen += arr.byteLength

  let res = new Uint8Array(totalLen)

  let offset = 0

  for (let arr of arrays) {
    let uint8Arr = new Uint8Array(arr)

    res.set(uint8Arr, offset)

    offset += arr.byteLength
  }

  return res.buffer
}

export default class CCWs {
  ws: WebSocket
  constructor(public cid: string | number) {
    this.init_ws()
  }

  init_ws = onceCall(async () => {
    const { url, reg_datas } = await this.get_ws_info()
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    // this.ws.addEventListener('message', (e) => {
    //   // console.log(e.data)
    //   this.decode_msg(e.data)
    // })
    await new Promise((res) => this.ws.addEventListener('open', res))

    for (let buffer of Object.values(reg_datas)) {
      this.ws.send(buffer)
    }

    const beatTimer = setInterval(() => {
      this.ws.send(reg_datas.beat_data)
    }, 1000)
    this.ws.addEventListener('close', () => {
      clearInterval(beatTimer)
    })

    return this.ws
  })
  getWs = this.init_ws

  async get_ws_info() {
    const res = await fetch(
      `https://api.cc.163.com/v1/activitylives/anchor/lives?anchor_ccid=${this.cid}`,
      { mode: 'cors' }
    ).then((res) => {
      console.log('res', res)
      return res.json()
    })

    console.log('res data', res)
    let { channel_id, room_id, gametype } = res.data[this.cid]

    let reg_datas = {
      reg_data: this.get_reg(),
      beat_data: this.get_beat(),
      join_data: this.get_join(channel_id, gametype, room_id),
    }
    return {
      url: 'wss://weblink.cc.163.com/',
      reg_datas,
    }
  }

  // ---- cc ws连接信息
  get_reg() {
    let sid = 6144
    let cid = 2
    let update_req_info = {
      '22': 640,
      '23': 360,
      '24': 'web',
      '25': 'Linux',
      '29': '163_cc',
      '30': '',
      '31': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36',
    }
    let device_token = uuid() + '@web.cc.163.com'
    let macAdd = device_token
    let data = {
      'web-cc': new Date().getTime(),
      macAdd: macAdd,
      device_token: device_token,
      page_uuid: uuid(),
      update_req_info: update_req_info,
      system: 'win',
      memory: 1,
      version: 1,
      webccType: 4253,
    }
    let reg_data = combineArrayBuffer(
      struct('<HHI').pack(sid, cid, 0),
      this.encode_dict(data)
    )
    return reg_data
  }
  get_beat() {
    let sid = 6144
    let cid = 5
    let data = {}
    let beat_data = combineArrayBuffer(
      struct('<HHI').pack(sid, cid, 0),
      this.encode_dict(data)
    )
    return beat_data
  }
  get_join(data_cid: string, data_gametype: string, data_roomId: string) {
    let sid = 512
    let cid = 1
    let data = {
      cid: data_cid,
      gametype: data_gametype,
      roomId: data_roomId,
    }
    let join_data = combineArrayBuffer(
      struct('<HHI').pack(sid, cid, 0),
      this.encode_dict(data)
    )
    return join_data
  }
  // ---- cc ws连接信息

  encode_dict(data: Record<string, any>) {
    let n = Object.keys(data).length
    let r = (n < 16 && 128 + n) || (n >= 16 && n <= 65535 && 222) || 223
    let t = bytes([r])
    Object.entries(data).forEach(([k, v]) => {
      t = combineArrayBuffer(t, this.encode_str(k))
      if (isNumber(v)) t = combineArrayBuffer(t, this.encode_num(v))
      else if (isString(v)) t = combineArrayBuffer(t, this.encode_str(v))
      else if (isObject(v)) t = combineArrayBuffer(t, this.encode_dict(v))
    })
    return t
  }
  encode_str(r: string) {
    let n = r.length
    let i = 5 + 3 * n

    let s, f
    if (n < 32) {
      s = f = 1
    } else if (n <= 255) {
      s = f = 2
    } else if (n <= 65535) {
      s = f = 3
    } else {
      s = f = 5
    }
    let b
    if (s == 1) {
      b = 160 + n
    } else if (s <= 3) {
      b = 215 + s
    } else {
      b = 219
    }

    let e: ArrayBuffer
    if (f == 1) e = bytes([b])
    else e = bytes([b, n])

    return combineArrayBuffer(e, bytes(r))
  }
  encode_num(e: number) {
    if (e <= 255) return struct('>B').pack(e)
    if (255 < e && e <= 65535) {
      let t = struct('>H').pack(e)
      return combineArrayBuffer(bytes([0xcd]), t)
    } else {
      var t = []
      var r = 9
      var n = 0
      var i = 52
      var o = 8
      var s = 8 * o - i - 1
      var c = (1 << s) - 1
      var h = c >> 1
      var l = 0
      if (i == 23) {
        l = Math.pow(2, -24) - Math.pow(2, -77)
      }
      var d = o - 1
      if (n) d = 1

      var p = -1
      if (n) p = 1

      var y = 0
      if (e < 0 || (e == 0 && 1 / e)) {
        y = 1
      }

      while (i >= 8) {
        e = Math.abs(e)
        var f = Math.floor(Math.log(e) / Math.log(2))
        var u = Math.pow(2, -1 * f)
        if (e * u < 1) {
          f -= 1
          u *= 2
        }
        if (f + h >= 1) {
          e += l / u
        } else {
          e += l * Math.pow(2, 1 - h)
        }
        if (e * u >= 2) {
          f += 1
          u /= 2
        }
        var a = 0
        if (f + h >= c) {
          f = c
        } else if (f + h >= 1) {
          a = (e * u - 1) * Math.pow(2, i)
          f += h
        } else {
          a = e * Math.pow(2, h - 1) * Math.pow(2, i)
          f = 0
        }
        t.push(255 & a)
        d += p
        a /= 256
        i -= 8
      }

      f = (f << i) | a
      s += i
      while (s > 0) {
        t.push(255 & f)
        d += p
        f /= 256
        s -= 8
      }

      t[t.length - 1] |= 128 * y

      t.reverse()
      return combineArrayBuffer(bytes([0xcb]), bytes(t))
    }
  }

  decode_msg(e: ArrayBuffer): Omit<DanType, 'time'>[] {
    const [n, r, p] = struct('<HHI').unpack(e.slice(0, 8))
    const i = `tcp-${n}-${r}`
    const studio: Record<string, string> = {
      'tcp-512-32784': 'origin',
      'tcp-515-32785': 'chat',
      'tcp-535-32769': 'gamechat',
    }

    let o
    const msg_type = studio[i]
    if (msg_type) {
      let uInt8 = new Uint8Array(e)
      if (p) {
        const [s] = struct('<I').unpack(e.slice(8, 12))
        const a = e.slice(12)
        if (a.byteLength == s) {
          o = a
          uInt8 = uInt8.slice(12)
        }
      } else {
        o = e.slice(8)
        uInt8 = uInt8.slice(8)
      }

      if (uInt8[0] == 120) {
        console.log('type 120')
        uInt8 = pako.inflate(uInt8)
      }

      const ccMsgDecode = new CCMsgDecode(e, uInt8)
      const msg = ccMsgDecode.de_init(uInt8)

      // console.log(msg_type, i, msg)

      let ms: any
      if (msg_type == 'origin') ms = msg['data']['msg_list']
      else ms = msg['msg']

      switch (msg_type) {
        case 'origin': {
          let data = msg['data']['msg_list']
          data.forEach((data: any) => {
            let name = data['name']
            // console.log(`${name} 来到直播间`, data)
          })
          return null
        }
        case 'chat': {
          let data = msg['msg']
          return data.map((data: any) => {
            let name = data[197],
              content = data[4]
            // data[35] 可能是颜色，注意下
            let color = data[35] ? `#${data[35]}` : '#fff'
            if (data[99]) {
              try {
                color = JSON.parse(data[99]).barrage_info.color
              } catch (error) {
                // no color
              }
            }
            if (color[0] != '#') color = '#' + color
            // console.log(
            //   `${name}:${content}`,
            //   `color? ${data[35]} ${color}`,
            //   data
            // )
            return {
              text: content,
              color,
              type: 'right',
              uid: name,
              uname: name,
            } as Omit<DanType, 'time'>
          })
        }
        // 这什么鬼玩意没触发过，不管了
        // case 'gamechat': {
        // }
      }
      // }
    }
  }
}
