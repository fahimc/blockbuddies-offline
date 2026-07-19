import { expect, test, type Page } from '@playwright/test'

async function enterWorld(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByLabel('Character name').fill('MapStreamer')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.getByTestId('game-canvas').waitFor()
  await page.getByRole('button', { name: 'Start Playing' }).click()
}

test('pans beyond town and travels to a fixed outlying stadium tile', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await enterWorld(page)
  await page.getByRole('button', { name: 'Open town map' }).click()

  const map = page.getByTestId('town-map')
  const coordinate = page.locator('.bb-world-map-coordinate')
  const footballMarker = page.getByTestId('map-marker-football')
  await expect(map).toBeVisible()
  await expect(footballMarker).toBeVisible()

  const mapBox = await map.boundingBox()
  expect(mapBox).not.toBeNull()
  for (let pass = 0; pass < 3; pass += 1) {
    await page.mouse.move(
      mapBox!.x + mapBox!.width * 0.72,
      mapBox!.y + mapBox!.height * 0.34,
    )
    await page.mouse.down()
    await page.mouse.move(
      mapBox!.x + mapBox!.width * 0.95,
      mapBox!.y + mapBox!.height * 0.12,
      {
        steps: 8,
      },
    )
    await page.mouse.up()
  }

  await expect
    .poll(async () => {
      const match = (await coordinate.innerText()).match(/X (-?\d+)/)
      return Number(match?.[1] ?? 0)
    })
    .toBeLessThan(-60)

  await page.getByRole('button', { name: 'Show all destinations' }).click()
  await expect(footballMarker).toBeVisible()
  const beforeZoom = await footballMarker.getAttribute('style')
  await page.getByRole('button', { name: 'Zoom map in' }).click()
  await expect
    .poll(() => footballMarker.getAttribute('style'))
    .not.toBe(beforeZoom)

  await page
    .getByRole('button', { name: 'Football Pitch', exact: true })
    .click()
  await page.getByRole('button', { name: 'Travel to Football Pitch' }).click()

  await expect(map).not.toBeVisible()
  await expect(
    page.getByText('Hold Kick for power - score goals for coins'),
  ).toBeVisible()
  await expect(page.getByText('GOAL').first()).toBeVisible()
})
