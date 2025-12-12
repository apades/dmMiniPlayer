import { expect, test } from './fixtures'
import { onPageAndExtensionLoaded, wait } from './utils'

const testUrls = [
  'https://www.bilibili.com/video/BV17E411k7kv/?vd_source=8e6ad3d5f5612b1d591931b1eff4dea7',
  'https://live.douyin.com/870887192950',
  // 'https://www.youtube.com/watch?v=SXC2wO1XdMI&ab_channel=Picon%2F%E3%83%94%E3%82%B3%E3%83%B3OFFICIALCHANNEL',
]
const testUrl = testUrls[0]

test('测试浮动按钮是否正常', async ({ page, browser }, testInfo) => {
  await page.goto(testUrl)
  await onPageAndExtensionLoaded(page)

  await expect(page.locator('.rc-float-btn')).not.toBeVisible()

  const videoHandles = await page.waitForSelector('video')
  await videoHandles.dispatchEvent('mousemove', {
    bubbles: true,
  })
  const floatBtn = await page.locator('.rc-float-btn')
  await expect(floatBtn).toBeVisible()
})

for (const url of testUrls) {
  test(`docPIP能否打开 - ${new URL(url).hostname}`, async ({
    page,
    browser,
  }) => {
    await page.goto(url)
    await onPageAndExtensionLoaded(page)

    const videoEl = await page.waitForSelector('video')
    const timer = setInterval(async () => {
      try {
        if (!videoEl || page.isClosed()) {
          clearInterval(timer)
          return
        }
        await videoEl.dispatchEvent('mousemove', {
          bubbles: true,
        })
      } catch (error) {
        clearInterval(timer)
      }
    }, 500)
    browser.on('disconnected', () => {
      clearInterval(timer)
    })

    // 点击float按钮
    const startPipBtn = page.locator('.start-pip-btn')
    await startPipBtn.click()

    await wait(1000)

    const pipWindow = await page.evaluate('documentPictureInPicture.window')

    await expect(pipWindow).not.toBeNull()

    clearInterval(timer)
  })
}

// test('bilibili大功能测试', () => {})
