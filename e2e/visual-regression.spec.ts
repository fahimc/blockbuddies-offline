import { expect, test, type Locator } from '@playwright/test'

test.describe('mobile visual regression', () => {
  test.use({
    viewport: { width: 576, height: 1024 },
    isMobile: true,
    hasTouch: true,
  })

  test('keeps the splash call-to-action anchored 30 percent from the top', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const area = page.locator('.bb-splash-start-area')
    const card = page.locator('.bb-splash-start-card')
    await expect(area).toBeVisible()
    await expect(card).toBeVisible()
    const areaBox = await requiredBox(area)
    const cardBox = await requiredBox(card)
    const areaCentreY = areaBox.y + areaBox.height / 2
    const areaCentreX = areaBox.x + areaBox.width / 2
    const cardCentreY = cardBox.y + cardBox.height / 2
    const cardCentreX = cardBox.x + cardBox.width / 2
    const viewport = page.viewportSize()
    if (!viewport) throw new Error('Expected viewport')

    expect(Math.abs(cardCentreY - areaCentreY)).toBeLessThan(2)
    expect(Math.abs(cardCentreX - areaCentreX)).toBeLessThan(2)
    expect(Math.abs(cardCentreY - viewport.height * 0.3)).toBeLessThan(4)
    expect(Math.abs(cardCentreX - viewport.width / 2)).toBeLessThan(4)
    await expect(page).toHaveScreenshot(
      'splash-portrait.png',
      screenshotOptions,
    )
  })

  test('keeps the splash logo and start button at the 30 percent mobile anchor', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 360, height: 700 },
      { width: 393, height: 851 },
      { width: 576, height: 1024 },
      { width: 720, height: 1280 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)

      const areaBox = await requiredBox(page.locator('.bb-splash-start-area'))
      const cardBox = await requiredBox(page.locator('.bb-splash-start-card'))
      const buttonBox = await requiredBox(
        page.getByRole('button', { name: 'Start' }),
      )
      const logoBox = await requiredBox(page.locator('.bb-splash-brand'))
      const areaCentreY = areaBox.y + areaBox.height / 2
      const areaCentreX = areaBox.x + areaBox.width / 2
      const cardCentreY = cardBox.y + cardBox.height / 2
      const cardCentreX = cardBox.x + cardBox.width / 2

      expect(Math.abs(cardCentreY - areaCentreY)).toBeLessThan(2)
      expect(Math.abs(cardCentreX - areaCentreX)).toBeLessThan(2)
      expect(Math.abs(cardCentreY - viewport.height * 0.3)).toBeLessThan(4)
      expect(Math.abs(cardCentreX - viewport.width / 2)).toBeLessThan(4)
      expect(logoBox.x + logoBox.width / 2).toBeCloseTo(areaCentreX, 0)
      expect(buttonBox.x + buttonBox.width / 2).toBeCloseTo(areaCentreX, 0)
      expect(buttonBox.y).toBeGreaterThan(logoBox.y + logoBox.height)
      await expect(page.getByRole('button', { name: 'Start' })).toBeInViewport()
    }
  })

  test('keeps character creation and clothing in separate responsive rows', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start' }).click()
    await page.evaluate(() => document.fonts.ready)

    const hub = page.locator('.bb-customizer-hub')
    const leftCategories = hub.locator('.bb-hub-rail.left')
    const rightCategories = hub.locator('.bb-hub-rail.right')
    const footer = page.locator('.bb-customizer-footer')
    const hubBox = await requiredBox(hub)
    const leftBox = await requiredBox(leftCategories)
    const rightBox = await requiredBox(rightCategories)
    const hubFooterBox = await requiredBox(footer)

    expect(leftBox.y).toBeGreaterThan(hubBox.y)
    expect(rightBox.y).toBeGreaterThan(leftBox.y + leftBox.height)
    expect(rightBox.y + rightBox.height).toBeLessThan(hubFooterBox.y)
    await expect(page).toHaveScreenshot(
      'customizer-hub-portrait.png',
      screenshotOptions,
    )

    await page.getByRole('button', { name: 'Customize' }).click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Clothing' })).toBeVisible()

    const stageBox = await requiredBox(page.locator('.bb-clothing-stage'))
    const catalogBox = await requiredBox(page.locator('.bb-custom-catalog'))
    const clothingFooterBox = await requiredBox(footer)
    expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(catalogBox.y)
    expect(catalogBox.y + catalogBox.height).toBeLessThanOrEqual(
      clothingFooterBox.y,
    )

    const previewFits = await page
      .locator('.bb-custom-item-preview')
      .evaluateAll((previews) =>
        previews.every((preview) => {
          const child = preview.firstElementChild
          if (!child) return false
          const parentBox = preview.getBoundingClientRect()
          const childBox = child.getBoundingClientRect()
          return (
            childBox.left >= parentBox.left &&
            childBox.right <= parentBox.right &&
            childBox.top >= parentBox.top &&
            childBox.bottom <= parentBox.bottom
          )
        }),
      )
    expect(previewFits).toBe(true)
    await expect(page).toHaveScreenshot(
      'customizer-clothing-portrait.png',
      screenshotOptions,
    )
  })
})

const screenshotOptions = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  maxDiffPixelRatio: 0.004,
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('Expected visible layout box')
  return box
}
