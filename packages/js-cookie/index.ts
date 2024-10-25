/**
 * 参考自 https://github.com/js-cookie/js-cookie/blob/main/src/api.mjs
 */
import { assign } from 'lodash-es'

type CookieHandler = {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options?: CookieOptions) => void
  remove: (name: string, options?: CookieOptions) => void
}

interface CookieOptions {
  /**
   * Define when the cookie will be removed. Value can be a Number
   * which will be interpreted as days from time of creation or a
   * Date instance. If omitted, the cookie becomes a session cookie.
   */
  expires?: number | Date | undefined | string

  /**
   * Define the path where the cookie is available. Defaults to '/'
   */
  path?: string | undefined

  /**
   * Define the domain where the cookie is available. Defaults to
   * the domain of the page where the cookie was created.
   */
  domain?: string | undefined

  /**
   * A Boolean indicating if the cookie transmission requires a
   * secure protocol (https). Defaults to false.
   */
  secure?: boolean | undefined

  /**
   * Asserts that a cookie must not be sent with cross-origin requests,
   * providing some protection against cross-site request forgery
   * attacks (CSRF)
   */
  sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None' | undefined

  /**
   * An attribute which will be serialized, conformably to RFC 6265
   * section 5.2.
   */
  [property: string]: any
}

type CookieHandlerEnter = {
  (cookie: string): CookieHandler
} & CookieHandler

const converter = {
  read: function (value: string) {
    if (value[0] === '"') {
      value = value.slice(1, -1)
    }
    return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
  },
  write: function (value: string) {
    return encodeURIComponent(value).replace(
      /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
      decodeURIComponent
    )
  },
}

const get = (cookie = '') => {
  return (name: string) => {
    const cookies = cookie.split('; ')
    const jar: Record<any, any> = {}
    for (let i = 0; i < cookies.length; i++) {
      const parts = cookies[i].split('=')
      const value = parts.slice(1).join('=')

      try {
        const found = decodeURIComponent(parts[0])
        if (!(found in jar)) jar[found] = converter.read(value)
        if (name === found) {
          break
        }
      } catch {
        // Do nothing...
      }
    }

    return name ? jar[name] : jar
  }
}
const set = (cookie = '') => {
  return (name: string, value: string, attributes: CookieOptions) => {
    attributes = assign({}, { path: '/' }, attributes)
    if (typeof attributes.expires === 'number') {
      attributes.expires = new Date(Date.now() + attributes.expires * 864e5)
    }
    if (attributes.expires) {
      attributes.expires = (attributes.expires as any).toUTCString()
    }
    name = encodeURIComponent(name)
      .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
      .replace(/[()]/g, escape)

    let stringifiedAttributes = ''
    for (const attributeName in attributes) {
      if (!attributes[attributeName]) {
        continue
      }

      stringifiedAttributes += '; ' + attributeName

      if (attributes[attributeName] === true) {
        continue
      }

      // Considers RFC 6265 section 5.2:
      // ...
      // 3.  If the remaining unparsed-attributes contains a %x3B (";")
      //     character:
      // Consume the characters of the unparsed-attributes up to,
      // not including, the first %x3B (";") character.
      // ...
      stringifiedAttributes += '=' + attributes[attributeName].split(';')[0]
    }

    const newCookie =
      name + '=' + converter.write(value) + stringifiedAttributes
    if (cookie === document.cookie) {
      document.cookie = newCookie
    }
    return newCookie
  }
}
const remove = (cookie = '') => {
  return (name: string, attributes: CookieOptions) => {
    set(cookie)(name, '', assign({}, { expires: -1 }, attributes))
  }
}

const cookie = new Proxy(() => {}, {
  get: (_, name: keyof CookieHandler) => {
    switch (name) {
      case 'get':
        return get(document.cookie)
      case 'set':
        return set(document.cookie)
      case 'remove':
        return remove(document.cookie)
    }
  },
  apply: (_, [cookie]: [string]) => {
    return {
      get: get(cookie),
      set: set(cookie),
      remove: remove(cookie),
    }
  },
}) as any as CookieHandlerEnter

export default cookie
