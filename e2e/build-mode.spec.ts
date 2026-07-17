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
  await page.getByLabel('Character name').fill('BuilderTester')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.getByRole('button', { name: 'Start Playing' }).click()
  await expect(page.getByText('BuilderTester', { exact: true })).toBeVisible({
    timeout: 30_000,
  })
}

test.describe('mobile build mode HUD', () => {
  test.use({
    viewport: { width: 576, height: 1024 },
    isMobile: true,
    hasTouch: true,
  })

  test('selects build pieces and removes the highlighted world item', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000)
    await completeStartFlow(page)
    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuildModeInteraction(),
    )

    const palette = page.getByRole('complementary', { name: 'Build pieces' })
    const joystick = page.getByLabel('Move joystick')
    await expect(palette).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: 'Select build piece' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Build / })).toHaveCount(8)

    const paletteBox = await palette.boundingBox()
    const joystickBox = await joystick.boundingBox()
    expect(paletteBox).not.toBeNull()
    expect(joystickBox).not.toBeNull()
    expect(paletteBox!.y + paletteBox!.height).toBeLessThanOrEqual(
      joystickBox!.y,
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(576)

    await page.getByRole('button', { name: 'Build House' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__blockBuddiesE2E!.getGameplaySnapshot().selectedBuildPiece,
        ),
      )
      .toBe('house')

    await page.mouse.click(288, 300)
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__blockBuddiesE2E!.getGameplaySnapshot()
              .selectedBuildBlockId,
        ),
      )
      .toBe('e2e-build-house')
    const remove = page
      .getByRole('button', { name: 'Remove selected build item' })
      .first()
    await expect(remove).toBeEnabled()
    await page.screenshot({
      path: testInfo.outputPath('build-palette-selected-mobile.png'),
    })
    await remove.click()

    const snapshot = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getGameplaySnapshot(),
    )
    expect(snapshot.selectedBuildBlockId).toBeUndefined()
    expect(snapshot.placedBlocks.map((block) => block.id)).toEqual([
      'e2e-build-tree',
    ])
  })
})
