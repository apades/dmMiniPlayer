import { wait } from '@root/utils'
import { expect, test } from './fixtures'
import { evaluate } from './utils'

const url = 'https://bot-detector.rebrowser.net/'

test('bot detector', async ({ page }) => {
  await page.goto(url)

  await page.evaluate(() => window.dummyFn())

  // exposeFunctionLeak
  await page.exposeFunction('exposedFn', () => {
    console.log('exposedFn call')
  })

  // sourceUrlLeak
  await page.evaluate(() => document.getElementById('detections-json'))

  /*
    playwright - there is no way to explicitly evaluate script in an isolated context
    follow rebrowser-patches on github for the fix
  */
  await page.evaluate(() => document.getElementsByClassName('div'))

  await wait(3000)
  const { isBot, botStatus } = await evaluate(page, () => {
    const els = Array.from(
      document.querySelectorAll('tbody>tr>td:nth-child(1)'),
    ) as HTMLElement[]

    let botStatus = [] as string[],
      isBot = false
    for (const el of els) {
      if (el.innerText.startsWith('🔴')) {
        botStatus.push(el.innerText)
        isBot = true
      }
    }
    return { isBot, botStatus }
  })

  if (!isBot) {
    console.error('🔴 botStatus', botStatus)
  }
  await expect(isBot).toBe(false)
})
