import { expect, test } from '@playwright/test'

test('world map review renders the shared tile plan without placement errors', async ({
  page,
}) => {
  await page.goto('/world-map.html')

  await expect(
    page.getByRole('heading', { name: 'World Map Review' }),
  ).toBeVisible()
  const status = page.getByTestId('world-map-status')
  await expect(status).toHaveAttribute('data-errors', '0')
  await expect(status).toContainText('Placement validation passed')
  const canvas = page.getByTestId('world-map-canvas')
  await expect(canvas).toBeVisible()
  const hasRenderedPixels = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')
    if (!context) return false
    const pixels = context.getImageData(0, 0, 32, 32).data
    return pixels.some((value, index) => index % 4 !== 3 && value > 0)
  })
  expect(hasRenderedPixels).toBe(true)
})
