import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Playground server URL - assumes playground is running on default Vite port
// Start playground with: pnpm run playground:start
const PLAYGROUND_URL = process.env.PLAYGROUND_URL || 'http://localhost:5173'

// Helper function to get test events from page
async function getTestEvents(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    // @ts-expect-error - TypeScript can't infer window types in page.evaluate context
    return window.testEvents.slice()
  })
}

test.describe('KeyBinding', () => {
  test('should emit command_* events when keyboard shortcuts are pressed', async ({
    page,
  }) => {
    // Navigate to the playground KeyBinding test page
    await page.goto(`${PLAYGROUND_URL}/keyBinding/index.html`)

    // Wait for setup to complete
    await page.waitForFunction(
      () => {
        return window.testReady === true
      },
      { timeout: 10000 },
    )

    // Test 1: Press Space (should trigger command_playToggle)
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)

    const events1 = await getTestEvents(page)
    expect(events1).toContain('command_playToggle')

    // Test 2: Press ArrowLeft (should trigger command_rewind)
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)

    const events2 = await getTestEvents(page)
    expect(events2).toContain('command_rewind')

    // Test 3: Press ArrowRight and wait for keyup (should trigger command_forward)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200) // Wait for keyup event

    const events3 = await getTestEvents(page)
    expect(events3).toContain('command_forward')

    // Test 4: Press Shift+ArrowLeft (should trigger command_fineRewind)
    await page.keyboard.press('Shift+ArrowLeft')
    await page.waitForTimeout(100)

    const events4 = await getTestEvents(page)
    expect(events4).toContain('command_fineRewind')

    // Test 5: Press Shift+ArrowRight (should trigger command_fineForward)
    await page.keyboard.press('Shift+ArrowRight')
    await page.waitForTimeout(200)

    const events5 = await getTestEvents(page)
    expect(events5).toContain('command_fineForward')

    // Test 6: Press ArrowUp (should trigger command_volumeUp)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(100)

    const events6 = await getTestEvents(page)
    expect(events6).toContain('command_volumeUp')

    // Test 7: Press ArrowDown (should trigger command_volumeDown)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)

    const events7 = await getTestEvents(page)
    expect(events7).toContain('command_volumeDown')

    // Test 8: Press M (should trigger command_muteToggle)
    await page.keyboard.press('M')
    await page.waitForTimeout(100)

    const events8 = await getTestEvents(page)
    expect(events8).toContain('command_muteToggle')

    // Test 9: Press D (should trigger command_danmakuVisible)
    await page.keyboard.press('D')
    await page.waitForTimeout(100)

    const events9 = await getTestEvents(page)
    expect(events9).toContain('command_danmakuVisible')

    // Test 10: Press S (should trigger command_subtitleVisible)
    await page.keyboard.press('S')
    await page.waitForTimeout(100)

    const events10 = await getTestEvents(page)
    expect(events10).toContain('command_subtitleVisible')

    // Test 11: Press = (should trigger command_speedUp)
    await page.keyboard.press('=')
    await page.waitForTimeout(100)

    const events11 = await getTestEvents(page)
    expect(events11).toContain('command_speedUp')

    // Test 12: Press - (should trigger command_speedDown)
    await page.keyboard.press('-')
    await page.waitForTimeout(100)

    const events12 = await getTestEvents(page)
    expect(events12).toContain('command_speedDown')

    // Test 13: Press 0 (should trigger command_speedToggle)
    await page.keyboard.press('0')
    await page.waitForTimeout(100)

    const events13 = await getTestEvents(page)
    expect(events13).toContain('command_speedToggle')

    // Test 14: Press Enter (should trigger command_danmakuShowInput)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)

    const events14 = await getTestEvents(page)
    expect(events14).toContain('command_danmakuShowInput')

    // Test 15: Press R (should trigger command_autoResize)
    await page.keyboard.press('R')
    await page.waitForTimeout(100)

    const events15 = await getTestEvents(page)
    expect(events15).toContain('command_autoResize')

    // Test 16: Press Shift+P (should trigger command_screenshot)
    await page.keyboard.press('Shift+P')
    await page.waitForTimeout(100)

    const events16 = await getTestEvents(page)
    expect(events16).toContain('command_screenshot')

    // Test 17: Test press mode - hold ArrowRight (should trigger command_pressSpeedMode after 3 presses)
    // Clear previous events for this test
    await page.evaluate(() => {
      window.testEvents = []
    })

    // Press ArrowRight 3 times to trigger press mode
    // await page.keyboard.press('Space', { delay: 3000 })

    for (let i = 0; i < 1000; i++) {
      await page.keyboard.down('ArrowRight')
    }
    await page.waitForTimeout(100)

    const events17 = await getTestEvents(page)
    expect(events17).toContain('command_pressSpeedMode')

    // Release the key
    await page.keyboard.up('ArrowRight')
    await page.waitForTimeout(150)

    const events18 = await getTestEvents(page)
    // Should trigger release event
    expect(events18).toContain('command_pressSpeedMode_release')
  })

  test('should not emit events when typing in input fields', async ({
    page,
  }) => {
    await page.goto(`${PLAYGROUND_URL}/keyBinding/index.html`)

    await page.waitForFunction(
      () => {
        return window.testReady === true
      },
      { timeout: 10000 },
    )

    // Step 1: Test normal case - Press Space outside input fields - should trigger event
    await page.focus('body')
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)

    const events1 = await getTestEvents(page)
    expect(events1).toContain('command_playToggle')

    // Step 2: Test input fields - should NOT trigger event
    // Clear events for input field tests
    await page.evaluate(() => {
      window.testEvents = []
    })

    // Focus on input and press Space - should NOT trigger event
    await page.focus('#test-input')
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)

    const events2 = await getTestEvents(page)
    expect(events2).not.toContain('command_playToggle')

    // Focus on textarea and press Space - should NOT trigger event
    await page.focus('#test-textarea')
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)

    const events3 = await getTestEvents(page)
    expect(events3).not.toContain('command_playToggle')

    // Focus on contenteditable and press Space - should NOT trigger event
    await page.focus('#test-contenteditable')
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)

    const events4 = await getTestEvents(page)
    expect(events4).not.toContain('command_playToggle')

    // Step 3: Test normal case again - Press Space outside input fields - should trigger event again
    // Blur current focus first, then focus body
    // ? 单纯的focus body没法清除掉上一个focus，不知道是bug还是什么
    await page.evaluate(() => {
      if (document.activeElement) {
        ;(document.activeElement as HTMLElement).blur()
      }
    })
    await page.focus('body')
    await page.keyboard.press('Space')
    await page.waitForTimeout(100)

    const events5 = await getTestEvents(page)
    expect(events5).toContain('command_playToggle')
  })
})
