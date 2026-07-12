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
