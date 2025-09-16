import { dq1 } from '@root/utils'
import { Language } from '@root/utils/i18n'
import { onMessage } from 'webext-bridge/content-script'
import Browser from 'webextension-polyfill'
import { load as yamlLoad, dump as yamlDump } from 'js-yaml'

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    onMessage('start', () => {
      const { hostname } = location

      console.log('hostname', hostname)
      switch (hostname) {
        case 'chrome.google.com':
          doGoogle()
          break
      }

      async function doGoogle() {
        for (let lang of Object.values(Language)) {
          const tsLang = lang.replace('_', '-') as Language

          const transLangEl = dq1(`[data-value="${tsLang}"]`)
          if (!transLangEl) {
            throw new Error('Language not found')
          }
          transLangEl.click()

          const textareaEl = dq1('textarea')
          if (!textareaEl) {
            throw new Error('Textarea not found')
          }

          const text = await fetch(
            `chrome-extension://${Browser.runtime.id}/locales/${lang}.yml`,
          ).then((res) => res.text())

          const data = yamlLoad(text) as any
          textareaEl.value = data.desc
        }
      }
    })
  },
})
