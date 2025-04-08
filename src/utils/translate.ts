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
