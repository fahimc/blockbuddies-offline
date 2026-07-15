import { expect, test, type Page } from '@playwright/test'

async function completeStartFlow(page: Page, name = 'WorldTester') {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByLabel('Character name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
}

async function canvasPixelStats(page: Page) {
  const png = await page.getByTestId('game-canvas').screenshot()
  return page.evaluate(async (dataUrl) => {
    const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob())
    const sampleCanvas = document.createElement('canvas')
    sampleCanvas.width = bitmap.width
    sampleCanvas.height = bitmap.height
    const context = sampleCanvas.getContext('2d')!
    context.drawImage(bitmap, 0, 0)
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data
    let visibleSamples = 0
    const colours = new Set<string>()
    for (let index = 0; index < pixels.length; index += 256) {
      if (pixels[index + 3] === 0) continue
      visibleSamples += 1
      colours.add(`${pixels[index] >> 4}-${pixels[index + 1] >> 4}-${pixels[index + 2] >> 4}`)
    }
    bitmap.close()
    return { visibleSamples, colourBuckets: colours.size }
  }, `data:image/png;base64,${png.toString('base64')}`)
}

test('uses classroom seats and drives a parked car end to end', async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await completeStartFlow(page)

  await page.evaluate(() => window.__blockBuddiesE2E!.prepareClassroomSeatInteraction())
  await page.waitForTimeout(900)
  await expect(page.getByText('Ms Maple')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('classroom-whiteboard')).toContainText('Build a kind community')
  const classroomPixels = await canvasPixelStats(page)
  expect(classroomPixels.visibleSamples).toBeGreaterThan(500)
  expect(classroomPixels.colourBuckets).toBeGreaterThan(8)
  await page.screenshot({ path: testInfo.outputPath('classroom-desktop.png') })

  const chairAction = page.getByRole('button', { name: 'Sit on Classroom chair' }).first()
  await expect(chairAction).toBeVisible()
  await chairAction.click()
  await expect
    .poll(async () => (await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())).seatedSeatId)
    .toContain('school-chair-')
  await expect(page.getByRole('button', { name: 'Stand up' })).toBeVisible()
  await page.getByRole('button', { name: 'Stand up' }).click()
  await expect
    .poll(async () => (await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())).seatedSeatId)
    .toBeUndefined()

  await page.evaluate(() => window.__blockBuddiesE2E!.prepareParkingInteraction())
  const driveAction = page.getByRole('button', { name: 'Drive Sunny Car' })
  await expect(driveAction).toBeVisible()
  await driveAction.click()
  await expect
    .poll(async () => (await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())).activeVehicleId)
    .toBe('sunny-car')

  const beforeDrive = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition)
  await page.evaluate(() => window.__blockBuddiesE2E!.setDriveInput(1))
  await page.waitForTimeout(700)
  await page.evaluate(() => window.__blockBuddiesE2E!.setDriveInput(0, 0, true))
  await page.waitForTimeout(180)
  await page.evaluate(() => window.__blockBuddiesE2E!.setDriveInput(0))
  const afterDrive = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition)
  expect(Math.hypot(afterDrive[0] - beforeDrive[0], afterDrive[2] - beforeDrive[2])).toBeGreaterThan(0.25)
  const drivingPixels = await canvasPixelStats(page)
  expect(drivingPixels.visibleSamples).toBeGreaterThan(500)
  expect(drivingPixels.colourBuckets).toBeGreaterThan(8)
  await page.screenshot({ path: testInfo.outputPath('parking-drive-desktop.png') })

  await page.getByRole('button', { name: 'Exit car' }).click()
  await expect
    .poll(async () => (await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())).activeVehicleId)
    .toBeUndefined()
})

test.describe('mobile vehicle controls', () => {
  test.use({ viewport: { width: 720, height: 1280 }, isMobile: true, hasTouch: true })

  test('replaces run and jump actions with car and brake controls while driving', async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await completeStartFlow(page, 'MobileDriver')
    await page.evaluate(() => window.__blockBuddiesE2E!.prepareParkingInteraction())
    await page.getByRole('button', { name: 'Drive Sunny Car' }).click()

    await expect(page.getByRole('button', { name: 'Run' })).toBeHidden()
    await expect(page.getByLabel('Driving joystick')).toBeVisible()
    await expect(page.locator('.joystick-mode-label')).toHaveText('Drive')
    await expect(page.getByRole('button', { name: 'Brake' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exit car' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Toggle emotes' })).toBeHidden()
    const pixels = await canvasPixelStats(page)
    expect(pixels.visibleSamples).toBeGreaterThan(500)
    expect(pixels.colourBuckets).toBeGreaterThan(8)
    await page.screenshot({ path: testInfo.outputPath('parking-drive-mobile.png') })
  })
})
