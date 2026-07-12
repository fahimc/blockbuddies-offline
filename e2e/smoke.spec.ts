import { expect, test } from '@playwright/test'

test('opens menu and navigates to game shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeVisible()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
  await expect(page.getByText('Local server started')).toBeVisible()
})
