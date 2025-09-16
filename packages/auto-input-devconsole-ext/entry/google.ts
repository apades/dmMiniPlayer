import { dq, dq1, wait } from '@root/utils'
import { Language } from '@root/utils/i18n'

async function doGoogle() {
  for (let lang of Object.values(Language)) {
    const tsLang = lang.replace('_', '-') as Language

    const transLangEl = dq1(`[data-value="${tsLang}"]`)
    if (!transLangEl) {
      throw new Error('Language not found')
    }
    transLangEl.click()
    await wait(150)

    const data = await import(`../locales/${lang}.yml`)

    while (true) {
      const textareaEl = dq<HTMLTextAreaElement>(
        'article section label textarea',
      )[0]
      if (!textareaEl) {
        throw new Error('Textarea not found')
      }
      textareaEl.value = data.desc
      textareaEl.dispatchEvent(new Event('input', { bubbles: true }))
      textareaEl.dispatchEvent(new Event('change', { bubbles: true }))
      await wait(1000)

      if (textareaEl.value === data.desc) {
        break
      }
    }
  }
}

doGoogle()
