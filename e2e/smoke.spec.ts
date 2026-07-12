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

  for (const title of ['Leaderboard', 'Badges', 'Build', 'Server', 'Emotes']) {
    await page.getByTitle(title).click()
    await expect(page.getByRole('heading', { name: title === 'Server' ? 'Local Server' : title })).toBeVisible()
    await page.getByTitle('Close').click()
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
    await expect(page.locator('.bb-top-banner')).toBeVisible()
    await expect(page.locator('.bb-menu-screen-card').first()).toBeInViewport()

    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByTestId('game-canvas')).toBeVisible()
    await expect(page.locator('.desktop-hud')).toBeHidden()
    await expect(page.locator('.chat-panel-desktop')).toBeHidden()
    await expect(page.locator('.mobile-chat-button')).toBeVisible()
    await expect(page.locator('.virtual-joystick')).toBeVisible()
    await expect(page.locator('.mobile-jump-button')).toBeVisible()
  })
})
