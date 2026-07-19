import WebextEvent from '@root/shared/webextEvent'
import { sendMessage } from 'webext-bridge/content-script'

export const googleTranslate = (textArr: string[], target: string) => {
  return sendMessage(WebextEvent.bgFetch, {
    url: `https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=${target}&hl=zh-CN&dt=t&dt=bd&ie=UTF-8&oe=UTF-8&dj=1&source=icon`,
    options: {
      method: 'POST',
      body: textArr.map((v) => `q=${encodeURIComponent(v)}`).join('&'),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      type: 'json',
    },
  }).then((res: any) => res.map((v: any) => v[0]) as string[])
}

abstract class BaseTranslator {
  name = ''
  protected controller = new AbortController()
  abstract translate(
    texts: string[],
    toCode: string,
    fromCode?: string,
  ): Promise<string[]>

  abort() {
    this.controller.abort()
  }
}
class BingTranslator extends BaseTranslator {
  override name = 'bing'
  private URL = 'https://api-edge.cognitive.microsofttranslator.com/translate'
  private AUTH_URL = 'https://edge.microsoft.com/translate/auth'
  private token = ''

  constructor() {
    super()
    this.getToken = this.getToken.bind(this)
  }

  async translate(texts: string[], toCode: string, fromCode = '') {
    function normalizeLocale(code: string) {
      switch (code) {
        case 'zh_CN':
          return 'zh-Hans'
        case 'zh_TW':
          return 'zh-Hant'
        case 'auto':
          return ''
        default:
          return code
      }
    }

    toCode = normalizeLocale(toCode)
    fromCode = normalizeLocale(fromCode)
    if (toCode === fromCode || !texts.length) {
      return [...texts]
    }

    if (!this.token) {
      this.token = await this.getToken()
    }

    const body = texts.map((txt) => ({
      Text: txt,
    }))

    const requst = () => {
      return fetch(
        `${this.URL}?from=${fromCode}&to=${toCode}&api-version=3.0`,
        {
          signal: this.controller.signal,
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            authorization: `Bearer ${this.token}`,
            'content-type': 'application/json',
            // accept: '*/*',
            // pragma: 'no-cache',
            // 'cache-control': 'no-cache'

            // 'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
            // 'sec-ch-ua-mobile': '?0',
            // 'sec-ch-ua-platform': '"Linux"',
            // 'sec-fetch-dest': 'empty',
            // 'sec-fetch-mode': 'cors',
            // 'sec-fetch-site': 'none'
          },
        },
      )
    }

    let res = await requst()
    if (res.status === 401) {
      // token过期，需要重新获取token
      this.token = await this.getToken(false)
      res = await requst()
    }

    if (!res.ok) {
      throw new Error('bing translate fail')
    }

    const data = await res.json()
    return data.map((item: any) => item.translations[0].text) as string[]
  }

  private async getToken(useCache = true) {
    const CHACHE_KEY = '__bing_translation_token__'
    let token = ''
    if (useCache) {
      const cachedToken = localStorage[CHACHE_KEY]
      if (cachedToken) {
        token = cachedToken
      }
    }
    if (!token) {
      const res = await fetch(this.AUTH_URL, {
        method: 'GET',
        headers: {
          // accept: '*/*',
          // pragma: 'no-cache',
          // 'cache-control': 'max-age=0'
          // 'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
          // 'sec-ch-ua-mobile': '?0',
          // 'sec-ch-ua-platform': '"Linux"',
          // 'sec-fetch-dest': 'document',
          // 'sec-fetch-mode': 'navigate',
          // 'sec-fetch-site': 'none',
          // 'sec-fetch-user': '?1'
        },
      })
      if (!res.ok) {
        throw new Error('bing token fail')
      }
      token = await res.text()
      localStorage[CHACHE_KEY] = token
    }

    return token
  }
}

export const bingTranslate = (textArr: string[], target: string) => {
  return new BingTranslator().translate(textArr, target)
}
