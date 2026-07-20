import { expect, test, type Page } from '@playwright/test'

async function completeStartFlow(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByLabel('Character name').fill('KartRacer')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
}

test('joins, starts, drives, and finishes a three-lap kart race', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await completeStartFlow(page)

  const welcomeStart = page.getByRole('button', { name: 'Start Playing' })
  if (await welcomeStart.isVisible().catch(() => false))
    await welcomeStart.click()

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: 'Go Kart Racing' }).click()
  await expect(
    page.getByRole('heading', { name: 'Buddy Kart Circuit' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Play Go Karts' }).click()
  await expect(page.getByTestId('kart-race-hud')).toContainText(
    'Buddy Kart Circuit',
  )
  await expect(page.getByRole('button', { name: 'Exit kart' })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__blockBuddiesE2E!.getGameplaySnapshot().activeVehicleId,
      ),
    )
    .toBe('go-kart:red')

  const gridPosition = await page.evaluate(
    () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
  )
  expect(gridPosition[0]).toBeGreaterThan(189)
  expect(gridPosition[0]).toBeLessThan(195)
  expect(gridPosition[2]).toBeGreaterThan(-84)
  expect(gridPosition[2]).toBeLessThan(-78)

  await page.getByTestId('start-kart-race').click()
  await expect(page.getByTestId('kart-countdown')).toBeVisible()
  await expect
    .poll(
      () =>
        page.evaluate(
          () => window.__blockBuddiesE2E!.getGameplaySnapshot().kartRace.status,
        ),
      { timeout: 8_000 },
    )
    .toBe('racing')

  const beforeDrive = await page.evaluate(
    () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
  )
  await page.evaluate(() => window.__blockBuddiesE2E!.setDriveInput(1))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.__blockBuddiesE2E!.setDriveInput(0, 0, true))
  await page.waitForTimeout(180)
  await page.evaluate(() => window.__blockBuddiesE2E!.setDriveInput(0))
  const afterDrive = await page.evaluate(
    () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
  )
  expect(
    Math.hypot(afterDrive[0] - beforeDrive[0], afterDrive[2] - beforeDrive[2]),
  ).toBeGreaterThan(0.4)

  const coinsBeforeFinish = await page.evaluate(
    () => window.__blockBuddiesE2E!.getGameplaySnapshot().coins,
  )
  await page.evaluate(() => window.__blockBuddiesE2E!.completeGoKartRace())
  await expect(page.getByTestId('kart-race-hud')).toContainText('Finish!')
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__blockBuddiesE2E!.getGameplaySnapshot().coins,
      ),
    )
    .toBe(coinsBeforeFinish + 30)
})
