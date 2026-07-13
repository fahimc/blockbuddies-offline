import { expect, test } from '@playwright/test'

test('opens menu and navigates to game shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeVisible()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
  await expect(page.getByText('Local server started')).toBeVisible()
})

test('opens Roblox-inspired offline feature panels', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.getByTestId('game-canvas').waitFor()

  const avatarButton = page.locator('.desktop-hud').getByRole('button', { name: 'Avatar' })
  await avatarButton.scrollIntoViewIfNeeded()
  await avatarButton.click()
  await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skin' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hats' })).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await expect(page.getByRole('heading', { name: 'Body & Style' })).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Back' }).click()

  for (const title of ['Leaderboard', 'Badges', 'Build', 'Server', 'Emotes']) {
    const hudButton = page.locator('.desktop-hud').getByRole('button', { name: title })
    await hudButton.scrollIntoViewIfNeeded()
    await hudButton.click()
    await expect(page.getByRole('heading', { name: title === 'Server' ? 'Local Server' : title })).toBeVisible()
    if (title === 'Build') {
      await expect(page.getByRole('button', { name: 'House' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Auto Street' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Rotate' })).toBeVisible()
    }
    await page.keyboard.press('Escape')
  }

  const serverButton = page.locator('.desktop-hud').getByRole('button', { name: 'Server' })
  await serverButton.scrollIntoViewIfNeeded()
  await serverButton.click()
  await expect(page.getByRole('heading', { name: 'Local Party' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Host Local Party' })).toBeVisible()
  await expect(page.getByLabel('Join with invite code')).toBeVisible()
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
    await expect(page.getByRole('button', { name: 'Play' })).toBeInViewport()

    await page.getByRole('button', { name: 'Play' }).click()
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
    await expect(page.getByRole('button', { name: 'Play' })).toBeInViewport()
    await expect(page.locator('.bb-splash-feature-strip')).toBeInViewport()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(720)
  })
})
