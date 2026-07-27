import { expect, test, type Page } from '@playwright/test'

async function completeStartFlow(page: Page) {
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(
    page.getByRole('heading', { name: 'Customization Hub' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByLabel('Character name').fill('WorldPlanner')
  await page.getByRole('button', { name: 'Start Game' }).click()
  const startPlaying = page.getByRole('button', { name: 'Start Playing' })
  if (await startPlaying.isVisible()) await startPlaying.click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
}

test.describe('Buddy Rush world sites', () => {
  test.setTimeout(120_000)
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  test('renders distinct clubs and a compact bus shelter on their reserved lots', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page)

    const targets = [
      {
        id: 'luna-club' as const,
        label: 'Moonlight Club',
        screenshot: 'test-results/buddy-rush-views/moonlight.png',
      },
      {
        id: 'nori-club' as const,
        label: 'Builder Base',
        screenshot: 'test-results/buddy-rush-views/builder.png',
      },
      {
        id: 'pip-club' as const,
        label: 'Pop Party House',
        screenshot: 'test-results/buddy-rush-views/party.png',
      },
      {
        id: 'bus-stop' as const,
        label: /Buddy Bus/,
        screenshot: 'test-results/buddy-rush-views/bus-stop.png',
      },
    ]

    for (const target of targets) {
      await page.evaluate((id) => {
        window.__blockBuddiesE2E!.prepareBuddyRushWorldView(id)
      }, target.id)
      await page.waitForTimeout(1_200)
      await expect(page.getByText(target.label).first()).toBeVisible()
      await page.screenshot({
        path: target.screenshot,
        fullPage: true,
      })
    }
  })
})
