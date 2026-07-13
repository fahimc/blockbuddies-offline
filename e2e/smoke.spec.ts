import { expect, test } from '@playwright/test'

async function completeStartFlow(page: import('@playwright/test').Page, name = 'PixelPal') {
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByRole('heading', { name: 'Name Your Buddy' })).toBeVisible()
  await page.getByLabel('Character name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
}

test('opens menu and navigates to game shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeVisible()
  await completeStartFlow(page, 'FlowTester')
  await expect(page.getByTestId('game-canvas')).toBeVisible()
  await expect(page.getByText('FlowTester')).toBeVisible()
  await expect(page.getByText('Local server started')).toBeVisible()
})

test('opens Roblox-inspired offline feature panels', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/')
  await completeStartFlow(page)
  await page.getByTestId('game-canvas').waitFor()

  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
  await page.getByRole('button', { name: 'Customise Character' }).click()
  await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skin' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hats' })).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await expect(page.getByRole('heading', { name: 'Body & Style' })).toBeVisible()
  const bodyCustomizer = page.locator('.bb-customizer-body')
  await expect(bodyCustomizer.locator('.bb-body-stage .bb-mini-avatar')).toBeVisible()
  await bodyCustomizer.getByRole('button', { name: 'Colours', exact: true }).click()
  await expect(bodyCustomizer.getByText('Accent Colour')).toBeVisible()
  await expect(bodyCustomizer.locator('.bb-body-stage .bb-mini-avatar')).toBeVisible()
  await bodyCustomizer.getByRole('button', { name: 'Hair', exact: true }).click()
  await expect(bodyCustomizer.getByText('Hair Colour')).toBeVisible()
  await expect(bodyCustomizer.getByText('Hair Style')).toBeVisible()
  await expect(bodyCustomizer.getByText('Skin Tone')).toHaveCount(0)
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Back' }).click()

  for (const item of [
    { button: 'Leaderboard', heading: 'Leaderboard' },
    { button: 'Badges', heading: 'Badges' },
    { button: 'Build Mode', heading: 'Build' },
    { button: 'Local Party', heading: 'Local Server' },
    { button: 'Emotes', heading: 'Emotes' },
    { button: 'Settings', heading: 'Settings' },
  ]) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
    await page.getByRole('button', { name: item.button }).click()
    await expect(page.getByRole('heading', { name: item.heading })).toBeVisible()
    if (item.heading === 'Build') {
      await expect(page.getByRole('button', { name: 'House' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Auto Street' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Rotate' })).toBeVisible()
    }
    if (item.button === 'Local Party') {
      await expect(page.getByRole('heading', { name: 'Local Party' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Host Local Party' })).toBeVisible()
      await expect(page.getByLabel('Join with invite code')).toBeVisible()
    }
    await page.keyboard.press('Escape')
  }
})

test.describe('landscape phone layout', () => {
  test.use({
    viewport: { width: 1280, height: 576 },
    isMobile: true,
    hasTouch: true,
  })

  test('uses responsive splash and compact in-game controls', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('OFFLINE SANDBOX TOWN')).toHaveCount(0)
    await expect(page.locator('.bb-splash-poster')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start' })).toBeInViewport()

    await completeStartFlow(page, 'PhoneTester')
    await expect(page.getByTestId('game-canvas')).toBeVisible()
    await expect(page.locator('.desktop-hud')).toBeHidden()
    await expect(page.locator('.chat-panel-desktop')).toBeHidden()
    await expect(page.locator('.mobile-chat-button')).toBeVisible()
    await expect(page.locator('.virtual-joystick')).toBeVisible()
    await expect(page.locator('.mobile-jump-button')).toBeVisible()
  })
})

test.describe('portrait splash layout', () => {
  test.use({
    viewport: { width: 720, height: 1280 },
    isMobile: true,
    hasTouch: true,
  })

  test('keeps the splash art and play button inside a portrait phone viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.bb-splash-poster')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeVisible()
    await expect(page.getByText('Your world.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start' })).toBeInViewport()
    await expect(page.locator('.bb-splash-feature-strip')).toBeInViewport()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(720)
  })
})
