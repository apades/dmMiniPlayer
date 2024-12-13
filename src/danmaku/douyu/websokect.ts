import { getRandom } from './utils'
/*
   DouyuEx WebSocket UnLogin
    By: 小淳
*/
class Ex_WebSocket_UnLogin {
  ws: WebSocket
  timer: NodeJS.Timeout

  // 调用方法：
  // 连接：let a = new Ex_WebSocket_UnLogin("房间号", 消息回调函数);
  // 关闭连接: a.WebSocket_Close(); a = null; 记得null掉变量再重新连接
  // 消息回调函数建议用箭头函数，示例：(msg) => {}
  constructor(
    rid: string | number,
    msgHandler: (msg: string) => void,
    closeHandler: () => void,
  ) {
    if ('WebSocket' in window) {
      this.ws = new WebSocket(
        'wss://danmuproxy.douyu.com:850' + String(getRandom(2, 5)),
      ) // 负载均衡 8502~8504都可以用
      this.ws.onopen = () => {
        this.ws.send(WebSocket_Packet('type@=loginreq/roomid@=' + rid))
        this.ws.send(
          WebSocket_Packet('type@=joingroup/rid@=' + rid + '/gid@=-9999/'),
        )
        // this.ws.send(WebSocket_Packet("type@=sub/mt@=asr_caption/"));
        this.timer = setInterval(() => {
          this.ws.send(WebSocket_Packet('type@=mrkl/'))
        }, 40000)
      }
      this.ws.onerror = () => {
        closeHandler()
      }
      this.ws.onmessage = (e) => {
        let reader = new FileReader()
        reader.onload = () => {
          let arr = String(reader.result).split('\0') // 分包
          reader = null
          for (let i = 0; i < arr.length; i++) {
            if (arr[i].length > 12) {
              // 过滤第一条和心跳包
              msgHandler(arr[i])
            }
          }
        }
        reader.readAsText(e.data)
      }
      this.ws.onclose = () => {
        closeHandler()
      }
    }
  }
  close() {
    clearInterval(this.timer)
    this.ws.close()
  }
}

/*
   DouyuEx WebSocket
    By: 小淳
    此处为一些公共函数
*/

function WebSocket_Packet(str: string) {
  const MSG_TYPE = 689
  let bytesArr = stringToByte(str)
  let buffer = new Uint8Array(bytesArr.length + 4 + 4 + 2 + 1 + 1 + 1)
  let p_content = new Uint8Array(bytesArr.length) // 消息内容
  for (let i = 0; i < p_content.length; i++) {
    p_content[i] = bytesArr[i]
  }
  let p_length = new Uint32Array([bytesArr.length + 4 + 2 + 1 + 1 + 1]) // 消息长度
  let p_type = new Uint32Array([MSG_TYPE]) // 消息类型

  buffer.set(new Uint8Array(p_length.buffer), 0)
  buffer.set(new Uint8Array(p_length.buffer), 4)
  buffer.set(new Uint8Array(p_type.buffer), 8)
  buffer.set(p_content, 12)

  return buffer
}

function stringToByte(str: string) {
  let bytes = []
  let len, c
  len = str.length
  for (let i = 0; i < len; i++) {
    c = String(str).charCodeAt(i)
    if (c >= 0x010000 && c <= 0x10ffff) {
      bytes.push(((c >> 18) & 0x07) | 0xf0)
      bytes.push(((c >> 12) & 0x3f) | 0x80)
      bytes.push(((c >> 6) & 0x3f) | 0x80)
      bytes.push((c & 0x3f) | 0x80)
    } else if (c >= 0x000800 && c <= 0x00ffff) {
      bytes.push(((c >> 12) & 0x0f) | 0xe0)
      bytes.push(((c >> 6) & 0x3f) | 0x80)
      bytes.push((c & 0x3f) | 0x80)
    } else if (c >= 0x000080 && c <= 0x0007ff) {
      bytes.push(((c >> 6) & 0x1f) | 0xc0)
      bytes.push((c & 0x3f) | 0x80)
    } else {
      bytes.push(c & 0xff)
    }
  }
  return bytes
}

export { Ex_WebSocket_UnLogin }
