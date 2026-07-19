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

test.describe('mobile map pinch recovery', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  test('cancels an interrupted pinch, closes the map, and resumes movement', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await enterWorld(page)
    await page.getByRole('button', { name: 'Open town map' }).click()

    const map = page.getByTestId('town-map')
    const mapBox = await map.boundingBox()
    expect(mapBox).not.toBeNull()
    const centreX = mapBox!.x + mapBox!.width / 2
    const centreY = mapBox!.y + mapBox!.height / 2
    const client = await page.context().newCDPSession(page)

    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: centreX - 2, y: centreY, id: 11 },
        { x: centreX + 2, y: centreY, id: 12 },
      ],
    })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: centreX - 120, y: centreY - 20, id: 11 },
        { x: centreX + 120, y: centreY + 20, id: 12 },
      ],
    })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    })

    await expect(page.locator('.bb-world-map-coordinate')).not.toContainText(
      'NaN',
    )
    await expect(page.getByTestId('map-marker-football')).not.toHaveAttribute(
      'style',
      /NaN|Infinity/,
    )
    const paintedPixels = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        '.bb-world-map-canvas',
      )
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return 0
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data
      let painted = 0
      for (let index = 3; index < pixels.length; index += 160) {
        if (pixels[index] > 0) painted += 1
      }
      return painted
    })
    expect(paintedPixels).toBeGreaterThan(100)

    await page.getByRole('button', { name: 'Close map' }).click()
    await expect(map).toBeHidden()
    const before = await page.evaluate(
      () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
    )
    const joystick = page.getByLabel('Move joystick')
    const joystickBox = await joystick.boundingBox()
    expect(joystickBox).not.toBeNull()
    const joystickX = joystickBox!.x + joystickBox!.width / 2
    const joystickY = joystickBox!.y + joystickBox!.height / 2
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: joystickX, y: joystickY, id: 21 }],
    })
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: joystickX, y: joystickY - 38, id: 21 }],
    })
    await page.waitForTimeout(500)
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await expect
      .poll(async () => {
        const after = await page.evaluate(
          () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
        )
        return Math.hypot(after[0] - before[0], after[2] - before[2])
      })
      .toBeGreaterThan(0.1)
  })
})
