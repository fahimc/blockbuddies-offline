import { expect, test, type Locator } from '@playwright/test'

test.describe('mobile visual regression', () => {
  test.use({ viewport: { width: 576, height: 1024 }, isMobile: true, hasTouch: true })

  test('keeps the splash call-to-action vertically centred in its top region', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const card = page.locator('.bb-splash-start-card')
    await expect(card).toBeVisible()
    const cardBox = await requiredBox(card)
    const expectedCentre = Math.max(256, 1024 * 0.31) / 2

    expect(Math.abs(cardBox.y + cardBox.height / 2 - expectedCentre)).toBeLessThan(20)
    await expect(page).toHaveScreenshot('splash-portrait.png', screenshotOptions)
  })

  test('keeps character creation and clothing in separate responsive rows', async ({ page }) => {
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
    await expect(page).toHaveScreenshot('customizer-hub-portrait.png', screenshotOptions)

    await page.getByRole('button', { name: 'Customize' }).click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Clothing' })).toBeVisible()

    const stageBox = await requiredBox(page.locator('.bb-clothing-stage'))
    const catalogBox = await requiredBox(page.locator('.bb-custom-catalog'))
    const clothingFooterBox = await requiredBox(footer)
    expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(catalogBox.y)
    expect(catalogBox.y + catalogBox.height).toBeLessThanOrEqual(clothingFooterBox.y)

    const previewFits = await page.locator('.bb-custom-item-preview').evaluateAll((previews) =>
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
    await expect(page).toHaveScreenshot('customizer-clothing-portrait.png', screenshotOptions)
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
