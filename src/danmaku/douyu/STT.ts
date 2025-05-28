export class STT {
  escape(v: string) {
    return v.toString().replace(/@/g, '@A').replace(/\//g, '@S')
  }

  unescape(v: string) {
    if (!v) return
    return v.toString().replace(/@A/g, '@').replace(/@S/g, '/')
  }

  // serialize(raw) {
  //     if (util.isObject(raw)) {
  //         return Object.keys(raw).map(k => `${k}@=${this.escape(this.serialize(raw[k]))}/`).join('')
  //     } else if (Array.isArray(raw)) {
  //         return raw.map(v => `${this.escape(this.serialize(v))}/`).join('')
  //     } else if (util.isString(raw) || util.isNumber(raw)) {
  //         return raw.toString()
  //     }
  // }

  deserialize(raw: any): any {
    if (!raw) return
    if (raw.includes('//')) {
      return raw
        .split('//')
        .filter((e: any) => e !== '')
        .map((item: any) => this.deserialize(item))
    }

    if (raw.includes('@=')) {
      return raw
        .split('/')
        .filter((e: any) => e !== '')
        .reduce((o: any, s: any) => {
          const [k, v] = s.split('@=')
          o[k] = this.deserialize(this.unescape(v))
          return o
        }, {})
    }
    if (raw.includes('@A=')) {
      return this.deserialize(this.unescape(raw))
    }
    return raw.toString()
  }
}
