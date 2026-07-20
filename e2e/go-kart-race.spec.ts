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
  await page.evaluate(() =>
    window.__blockBuddiesE2E!.prepareGoKartInteraction(),
  )

  const welcomeStart = page.getByRole('button', { name: 'Start Playing' })
  if (await welcomeStart.isVisible().catch(() => false))
    await welcomeStart.click()

  const enterKart = page.getByRole('button', { name: 'Race Red Rocket' })
  await expect(enterKart).toBeVisible({ timeout: 15_000 })
  await enterKart.click()
  await expect(page.getByTestId('kart-race-hud')).toContainText(
    'Buddy Kart Circuit',
  )
  await expect(page.getByRole('button', { name: 'Exit kart' })).toBeVisible()

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
