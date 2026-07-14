import { expect, test } from '@playwright/test'

async function completeStartFlow(page: import('@playwright/test').Page, name = 'PixelPal') {
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByRole('heading', { name: 'Name Your Buddy' })).toBeVisible()
  await page.getByLabel('Character name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
}

test('opens menu and navigates to game shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeVisible()
  await completeStartFlow(page, 'FlowTester')
  await expect(page.getByTestId('game-canvas')).toBeVisible()
  await expect(page.getByTestId('mini-map')).toBeVisible()
  await expect(page.getByText('FlowTester')).toBeVisible()
  await expect(page.getByText('Local server started')).toBeVisible()
})

test('opens Roblox-inspired offline feature panels', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await completeStartFlow(page)
  await page.getByTestId('game-canvas').waitFor()

  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
  await page.getByRole('button', { name: 'Customise Character' }).click()
  await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skin' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hats' })).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await expect(page.getByRole('heading', { name: 'Body & Style' })).toBeVisible()
  const bodyCustomizer = page.locator('.bb-customizer-body')
  await expect(bodyCustomizer.locator('.bb-body-stage .bb-game-avatar-preview')).toBeVisible()
  await bodyCustomizer.getByRole('button', { name: 'Colours', exact: true }).click()
  await expect(bodyCustomizer.getByText('Accent Colour')).toBeVisible()
  await expect(bodyCustomizer.locator('.bb-body-stage .bb-game-avatar-preview')).toBeVisible()
  await bodyCustomizer.getByRole('button', { name: 'Hair', exact: true }).click()
  await expect(bodyCustomizer.getByText('Hair Colour')).toBeVisible()
  await expect(bodyCustomizer.getByText('Hair Style')).toBeVisible()
  await expect(bodyCustomizer.getByText('Skin Tone')).toHaveCount(0)
  await bodyCustomizer.getByRole('button', { name: 'Wardrobe', exact: true }).click()
  await expect(bodyCustomizer.getByText('Brick Borough Presets')).toBeVisible()
  await expect(bodyCustomizer.getByRole('button', { name: 'Import project' })).toBeVisible()
  await expect(bodyCustomizer.getByRole('heading', { name: 'Saved Styles' })).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Back' }).click()

  for (const item of [
    { button: 'Leaderboard', heading: 'Leaderboard' },
    { button: 'Badges', heading: 'Badges' },
    { button: 'Mini Games', heading: 'Mini Games' },
    { button: 'Build Mode', heading: 'Build' },
    { button: 'Local Party', heading: 'Local Server' },
    { button: 'Emotes', heading: 'Emotes' },
    { button: 'Settings', heading: 'Settings' },
  ]) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
    await page.getByRole('button', { name: item.button }).click()
    await expect(page.getByRole('heading', { name: item.heading })).toBeVisible()
    if (item.heading === 'Build') {
      await expect(page.getByRole('button', { name: 'House' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Auto Street' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Rotate' })).toBeVisible()
    }
    if (item.button === 'Mini Games') {
      await expect(page.getByRole('button', { name: 'Play Coin Rush' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Play Delivery Dash' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Play Hide & Seek' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Play Beginner Obby' })).toBeVisible()
    }
    if (item.button === 'Local Party') {
      await expect(page.getByRole('heading', { name: 'Local Party' })).toBeVisible()
      await expect(page.getByLabel('Room Name')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Host Room' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Find Rooms' })).toBeVisible()
      await expect(page.getByText('Room discovery needs the Android APK')).toBeVisible()
      await page.getByText('Manual code fallback').click()
      await expect(page.getByRole('button', { name: 'Host Local Party' })).toBeVisible()
      await expect(page.getByLabel('Join with invite code')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Paste Invite Code' })).toBeVisible()
      await page.getByRole('button', { name: 'Host Local Party' }).click()
      await expect(page.getByLabel('Host invite code preview')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Copy Host invite code' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Share Host invite code' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Paste Answer Code' })).toBeVisible()
    }
    if (item.button === 'Settings') {
      await expect(page.getByRole('textbox', { name: 'World Seed' })).toBeVisible()
      await expect(page.getByText('Procedural Borough')).toBeVisible()
      await expect(page.getByText('Night Mode')).toBeVisible()
    }
    await page.keyboard.press('Escape')
  }
})

test.describe('landscape phone layout', () => {
  test.use({
    viewport: { width: 1280, height: 576 },
    isMobile: true,
    hasTouch: true,
  })

  test('uses responsive splash and compact in-game controls', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('OFFLINE SANDBOX TOWN')).toHaveCount(0)
    await expect(page.locator('.bb-splash-poster')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start' })).toBeInViewport()

    await completeStartFlow(page, 'PhoneTester')
    await expect(page.getByTestId('game-canvas')).toBeVisible()
    await expect(page.locator('.desktop-hud')).toBeHidden()
    await expect(page.locator('.chat-panel-desktop')).toBeHidden()
    await expect(page.locator('.mobile-chat-button')).toBeVisible()
    await expect(page.locator('.virtual-joystick')).toBeVisible()
    await expect(page.locator('.mobile-jump-button')).toBeVisible()
    await expect(page.getByTestId('world-drag-control')).toBeVisible()
    await expect(page.getByTestId('mini-map')).toBeVisible()
  })
})

test.describe('portrait splash layout', () => {
  test.use({
    viewport: { width: 720, height: 1280 },
    isMobile: true,
    hasTouch: true,
  })

  test('keeps the splash art and play button inside a portrait phone viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.bb-splash-poster')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'BlockBuddies Offline' })).toBeVisible()
    await expect(page.getByText('Your world.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start' })).toBeInViewport()
    await expect(page.locator('.bb-splash-feature-strip')).toBeInViewport()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(720)
  })

  test('keeps the body customizer in phone-width columns', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
    await page.getByRole('button', { name: 'Customize' }).click()
    await expect(page.getByRole('heading', { name: 'Body & Style' })).toBeVisible()

    const bodyCustomizer = page.locator('.bb-customizer-body')
    const rail = bodyCustomizer.locator('.bb-body-section-rail')
    const stage = bodyCustomizer.locator('.bb-body-stage')
    const controls = bodyCustomizer.locator('.bb-body-controls')
    await expect(stage.locator('.bb-game-avatar-preview')).toBeVisible()
    await expect(bodyCustomizer.getByText('Hair Style')).toBeVisible()
    await expect(bodyCustomizer.getByText('Face Expression')).toBeVisible()

    const [mainBox, railBox, stageBox, controlsBox] = await Promise.all([
      bodyCustomizer.boundingBox(),
      rail.boundingBox(),
      stage.boundingBox(),
      controls.boundingBox(),
    ])
    expect(mainBox).not.toBeNull()
    expect(railBox).not.toBeNull()
    expect(stageBox).not.toBeNull()
    expect(controlsBox).not.toBeNull()
    if (!mainBox || !railBox || !stageBox || !controlsBox) return

    expect(railBox.x).toBeLessThan(stageBox.x)
    expect(stageBox.x + stageBox.width).toBeLessThanOrEqual(controlsBox.x + 6)
    expect(controlsBox.x + controlsBox.width).toBeLessThanOrEqual(720)
    expect(railBox.width / mainBox.width).toBeGreaterThan(0.08)
    expect(railBox.width / mainBox.width).toBeLessThan(0.16)
    expect(stageBox.width / mainBox.width).toBeGreaterThan(0.34)
    expect(stageBox.width / mainBox.width).toBeLessThan(0.46)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(720)

    await bodyCustomizer.getByRole('button', { name: 'Hair', exact: true }).click()
    await expect(bodyCustomizer.getByText('Hair Colour')).toBeVisible()
    await expect(bodyCustomizer.getByText('Hair Style')).toBeVisible()
    await expect(bodyCustomizer.getByText('Skin Tone')).toHaveCount(0)
    await bodyCustomizer.getByRole('button', { name: 'Colours', exact: true }).click()
    await expect(bodyCustomizer.getByText('Accent Colour')).toBeVisible()
    await expect(stage.locator('.bb-game-avatar-preview')).toBeInViewport()
    await bodyCustomizer.getByRole('button', { name: 'Wardrobe', exact: true }).click()
    await expect(bodyCustomizer.getByText('Brick Borough Presets')).toBeVisible()
    await expect(bodyCustomizer.getByRole('button', { name: 'Sample texture' })).toBeVisible()
    await expect(stage.locator('.bb-game-avatar-preview')).toBeInViewport()
  })

  test('keeps emote options below the preview on portrait phones', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
    await page.getByRole('button', { name: 'Customize' }).click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Emotes & Animations' })).toBeVisible()

    const emotes = page.locator('.bb-customizer-emotes')
    const preview = emotes.locator('.bb-emote-preview')
    const categoryStrip = emotes.getByRole('navigation', { name: 'Customization categories' })
    const catalog = emotes.locator('.bb-custom-catalog')
    await expect(categoryStrip.getByRole('button', { name: 'All' })).toBeVisible()
    await expect(categoryStrip.getByRole('button', { name: 'Actions' })).toBeVisible()
    await expect(catalog.getByText('Wave')).toBeVisible()

    const [mainBox, previewBox, stripBox, catalogBox] = await Promise.all([
      emotes.boundingBox(),
      preview.boundingBox(),
      categoryStrip.boundingBox(),
      catalog.boundingBox(),
    ])
    expect(mainBox).not.toBeNull()
    expect(previewBox).not.toBeNull()
    expect(stripBox).not.toBeNull()
    expect(catalogBox).not.toBeNull()
    if (!mainBox || !previewBox || !stripBox || !catalogBox) return

    expect(stripBox.y).toBeGreaterThan(previewBox.y)
    expect(stripBox.width).toBeGreaterThan(stripBox.height)
    expect(stripBox.width / mainBox.width).toBeGreaterThan(0.86)
    expect(catalogBox.x).toBeGreaterThanOrEqual(0)
    expect(catalogBox.x + catalogBox.width).toBeLessThanOrEqual(720)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(720)
  })
})
