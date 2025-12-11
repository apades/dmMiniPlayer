import { getTopParentsWithSameRect } from '@root/utils/dom'
import { expect, isDevArtifact, name, test } from './fixtures'
import { evaluate, wait } from './utils'

const testUrls = [
  'https://www.bilibili.com/video/BV17E411k7kv/?vd_source=8e6ad3d5f5612b1d591931b1eff4dea7',
  'https://live.douyin.com/870887192950',
  'https://www.youtube.com/watch?v=SXC2wO1XdMI&ab_channel=Picon%2F%E3%83%94%E3%82%B3%E3%83%B3OFFICIALCHANNEL',
]
const testUrl = testUrls[0]

test('测试浮动按钮是否正常', async ({ page, browser }, testInfo) => {
  await page.goto(testUrl)
  await page.waitForLoadState('load')

  await wait(1000)

  await expect(page.locator('.rc-float-btn')).not.toBeVisible()

  // Query all video elements in the page
  const videoHandles = await page.locator('video').all()
  for (const videoHandle of videoHandles) {
    // Get the topmost parent with same rect using getTopParentsWithSameRect
    const topDomSelector = await evaluate(
      videoHandle,
      (video: HTMLVideoElement, [getTopParentsWithSameRect]) => {
        const parents = getTopParentsWithSameRect(video)
        // Get the topmost parent or fallback to given video
        const topDom = parents.length ? parents[parents.length - 1] : video
        const hoverEvent = new MouseEvent('mousemove', {
          bubbles: true,
        })
        topDom.dispatchEvent(hoverEvent)
        // generate a unique selector for this topDom for mouse move
        if (topDom === document.body) return 'body'
        if (topDom.id) return `#${topDom.id}`
        const tag = topDom.tagName.toLowerCase()
        const className = topDom.className
        const id = topDom.id
        // Use nth-child for basic uniqueness
        // const nth = Array.from(topDom.parentNode!.children).indexOf(topDom) + 1
        return [
          tag,
          className && `.${className.replaceAll(' ', '.')?.trim()}`,
          id && `#${id?.trim()}`,
        ]
          .filter(Boolean)
          .join('')
      },
      [getTopParentsWithSameRect],
    )
    console.log('topDomSelector', topDomSelector)
    // trigger floatButton init
    // await page.hover(topDomSelector)
    // await wait(2000)
    await page.hover(topDomSelector)
  }
  const floatBtn = await page.locator('.rc-float-btn')
  console.log('floatBtn', floatBtn)
  // TODO 为啥调试模式弹出浏览器就能通过，headless模式就不行
  // 而且fixtures里headless: false也不行
  await expect(floatBtn).toBeVisible()
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
