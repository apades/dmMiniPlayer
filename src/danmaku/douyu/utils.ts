const LOCAL_NAME = 'monitor_options'

export function redirectUrl(url: string): void {
  const HOSTS = [
    'https://www.douyuex.com',
    'http://www.douyuex.com',
    'https://www.douyuex.com/',
    'http://www.douyuex.com/',
    'https://douyuex.com/',
    'http://douyuex.com/',
    'http://new.douyuex.com/',
    'http://new.douyuex.com',
    'https://www.douyuex.com/introduction/',
    'https://www.douyuex.com/introduction',
    'https://www.douyuex.com/install/web.html',
    'https://www.douyuex.com/update/',
    'https://www.douyuex.com/update',
    // "http://localhost:3000",
    // "http://localhost:3000/",
  ]
  if (HOSTS.includes(url)) {
    location.href = 'https://xiaochunchun.gitee.io/douyuex/'
  }
}

export function getRoomGiftData(rid: string): Promise<IGiftData> {
  return new Promise((resolve, reject) => {
    fetch('https://gift.douyucdn.cn/api/gift/v2/web/list?rid=' + rid, {
      method: 'GET',
    })
      .then((res) => {
        return res.json()
      })
      .then((ret) => {
        let roomGiftData: IGiftData = {}
        if ('giftList' in ret.data) {
          for (let i = 0; i < ret.data.giftList.length; i++) {
            let item = ret.data.giftList[i]
            let svga = ''
            for (const key in item.effectInfo) {
              if (
                item.effectInfo[key]?.animation?.svga &&
                item.effectInfo[key]?.animation?.svga !== ''
              ) {
                svga = item.effectInfo[key].animation.svga
                break
              }
            }
            roomGiftData[item.id] = {
              n: item.name,
              pic:
                'https://gfs-op.douyucdn.cn/dygift' + item.basicInfo.focusPic,
              pc: item.priceInfo.price,
              svga: 'https://gfs-op.douyucdn.cn/dygift' + svga,
            }
          }
        }
        resolve(roomGiftData)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export function getBagGiftData(): Promise<IGiftData> {
  return new Promise((resolve, reject) => {
    fetch(
      'http://webconf.douyucdn.cn/resource/common/prop_gift_list/prop_gift_config.json',
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((res) => {
        return res.text()
      })
      .then((ret) => {
        let json: any = ret.substring(
          String('DYConfigCallback(').length,
          ret.length
        )
        json = json.substring(0, json.lastIndexOf(')'))
        json = JSON.parse(json)
        let obj: IGiftData = {}
        for (const key in json.data) {
          let item = json.data[key]
          obj[key] = {
            n: item.name,
            pic: item.himg,
            pc: item.pc,
            svga: item.effect_icon,
          }
        }
        resolve(obj)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export function getRealRid(rid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch('https://wxapp.douyucdn.cn/Live/Room/info/' + rid, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        return res.json()
      })
      .then((ret) => {
        resolve(ret.data.room_id)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export function getRandom(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}

export function getStrMiddle(
  str: string,
  before: string,
  after: string
): string {
  let m = str.match(new RegExp(before + '(.*?)' + after))
  return m ? m[1] : ''
}

export function getFlexStyle(options: IOptions, flag: IOptionsSwitch) {
  return {
    flex:
      options.switch[options.switch.length - 1] === flag
        ? '1'
        : `0 0 ${options.size[flag]}%`,
    order: options.switch.indexOf(flag) * 2 + 1,
  }
}

export function isArrayInText(arr: string[], text: string) {
  if (text !== '') {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== '' && text.indexOf(arr[i]) !== -1) {
        return true
      }
    }
  }
  return false
}

export function saveLocalOptions(options: IOptions) {
  localStorage.setItem(LOCAL_NAME, JSON.stringify(options))
}

export function getLocalOptions(): any {
  return JSON.parse(localStorage.getItem(LOCAL_NAME) || '{}')
}

export function formatObj(obj: any, objTemplate: any) {
  let ret: any = {}
  // 将obj格式化成objTemplate的属性格式，而obj的值不变，缺少的属性会增加上去
  for (const key in objTemplate) {
    if (key in obj) {
      if (
        Object.prototype.toString.call(objTemplate[key]) === '[object Object]'
      ) {
        let childRet = formatObj(obj[key], objTemplate[key])
        ret[key] = childRet
      } else {
        ret[key] = obj[key]
      }
    } else {
      ret[key] = objTemplate[key]
    }
  }
  return ret
}

// format timestamp
export function formatTime(
  timestamp: number | string,
  format = 'yyyy-MM-dd hh:mm:ss'
) {
  let date = new Date(Number(timestamp))
  let o: any = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  }
  if (/(y+)/.test(format)) {
    format = format.replace(
      RegExp.$1,
      (date.getFullYear() + '').substr(4 - RegExp.$1.length)
    )
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return format
}

export function getSuperchatOption(
  options: ISuperchatOption[],
  price: number
): ISuperchatOption | null {
  // 请确保options里的minPrice是从大到小排列
  if (price >= 0) {
    for (let i = 0; i < options.length; i++) {
      const item = options[i]
      if (price >= item.minPrice) {
        return item
      }
    }
  } else {
    let index = Math.abs(price) - 1
    if (index < options.length) {
      return [...options].reverse()[index]
    }
  }
  return null
}

export function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function speakText(text: string) {
  const speech = new SpeechSynthesisUtterance()
  // 设置播放内容
  speech.text = text
  // 设置话语的音调(0-2 默认1，值越大越尖锐,越低越低沉)
  speech.pitch = 0.8
  // 设置说话的速度(0.1-10 默认1，值越大语速越快,越小语速越慢)
  speech.rate = 1
  // 设置说话的音量
  speech.volume = 10
  // 设置播放语言
  speech.lang = 'zh-CN'
  // 播放结束后调用
  speech.onend = (event) => {}
  // 加入播放队列
  window.speechSynthesis.speak(speech)
}

enum Color {
  red = 1,
  blue = 2,
  green = 3,
  orange = 4,
  purple = 5,
  pink = 6,
  noColor = undefined,
}

enum ColorTransMap {
  red = 'rgb(255, 46, 46)',
  blue = 'rgb(0, 204, 255)',
  green = 'rgb(102, 255, 0)',
  orange = 'rgb(255, 102, 0)',
  purple = 'rgb(204, 0, 255)',
  pink = 'rgb(246, 68, 127)',
  noColor = '#fff',
}

export function getTransColor(type: number) {
  const color = Color[type as any]
  return (ColorTransMap as any)[color as any]
}
