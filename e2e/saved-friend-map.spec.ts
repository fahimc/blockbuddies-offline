import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

async function enterWorld(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByLabel('Character name').fill('CharacterCommander')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.getByTestId('game-canvas').waitFor()
  await page.getByRole('button', { name: 'Start Playing' }).click()
}

test('commands a created character from the infinite map', async ({ page }) => {
  await enterWorld(page)
  await page.evaluate(() =>
    window.__blockBuddiesE2E?.createLocalPartyFriend('Map Walker'),
  )
  await page.getByRole('button', { name: 'Open town map' }).click()

  await page
    .locator('.bb-map-character-list')
    .getByRole('button', { name: 'Select Map Walker on map' })
    .click()
  await page
    .getByRole('button', { name: 'Football Pitch', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Teleport Map Walker to target' })
    .click()

  await expect
    .poll(() =>
      page.evaluate(
        () => window.__blockBuddiesE2E?.getGameplaySnapshot().savedFriends[0],
      ),
    )
    .toMatchObject({ position: [90, 0, -33] })

  const map = page.getByTestId('town-map')
  const bounds = await map.boundingBox()
  expect(bounds).not.toBeNull()
  await page.mouse.click(
    bounds!.x + bounds!.width * 0.7,
    bounds!.y + bounds!.height * 0.72,
  )
  const target = page.getByTestId('map-character-target')
  await expect(target).toBeVisible()
  const title = await target.getAttribute('title')
  const coordinates = title?.match(/X (-?\d+(?:\.5)?), Z (-?\d+(?:\.5)?)/)
  expect(coordinates).not.toBeNull()

  await page
    .getByRole('button', { name: 'Send Map Walker walking to target' })
    .click()
  const walkingFriend = await page.evaluate(
    () => window.__blockBuddiesE2E?.getGameplaySnapshot().savedFriends[0],
  )
  expect(walkingFriend?.movement?.destination).toEqual([
    Number(coordinates![1]),
    0,
    Number(coordinates![2]),
  ])
  expect(walkingFriend?.movement?.waypoints.length).toBeGreaterThan(1)
})
