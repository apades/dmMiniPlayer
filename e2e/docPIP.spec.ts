import { wait } from '@root/utils'
import { expect, isDevArtifact, name, test } from './fixtures'

const testUrls = [
  'https://www.bilibili.com/video/BV17E411k7kv/?vd_source=8e6ad3d5f5612b1d591931b1eff4dea7',
  'https://live.douyin.com/870887192950',
  'https://www.youtube.com/watch?v=SXC2wO1XdMI&ab_channel=Picon%2F%E3%83%94%E3%82%B3%E3%83%B3OFFICIALCHANNEL',
]
const testUrl = testUrls[1]

test('测试浮动按钮是否正常', async ({ page, browser }, testInfo) => {
  await page.goto(testUrl)
  await page.waitForLoadState('load')

  await expect(page.locator('.rc-float-btn')).not.toBeVisible()

  await page.locator('video').hover()

  await expect(page.locator('.rc-float-btn')).toBeVisible()

  // await new Promise((res) => browser.on('disconnected', res))
})

for (const url of testUrls) {
  test(`docPIP能否打开 - ${new URL(url).hostname}`, async ({
    page,
    browser,
  }) => {
    await page.goto(url)
    await page.waitForLoadState('load')

    const videoEl = await page.waitForSelector('video')
    await videoEl.dispatchEvent('mousemove', {
      bubbles: true,
    })

    // 点击float按钮
    const floatBtn = page.locator('.rc-float-btn img')
    await floatBtn.click()

    await wait(1000)

    const pipWindow = await page.evaluate('documentPictureInPicture.window')

    await expect(pipWindow).not.toBeNull()

    // await new Promise((res) => browser.on('disconnected', res))
  })
}

test('bilibili大功能测试', () => {})
