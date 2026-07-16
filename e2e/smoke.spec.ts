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
  const nameInput = page.getByLabel('Character name')
  const startGame = page.getByRole('button', { name: 'Start Game' })
  await expect(nameInput).not.toBeFocused()
  await expect(startGame).toBeInViewport()
  await nameInput.fill(name)
  await startGame.click()
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
    { button: 'Town Map', heading: 'Town Map' },
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
    await page.getByRole('button', { name: item.button, exact: true }).click()
    await expect(page.getByRole('heading', { name: item.heading })).toBeVisible()
    if (item.heading === 'Build') {
      await expect(page.getByRole('button', { name: 'House' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Auto Street' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Rotate' })).toBeVisible()
    }
    if (item.button === 'Town Map') {
      await expect(page.getByTestId('town-map')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Travel to Spawn Plaza' })).toBeVisible()
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
    const runButton = page.getByRole('button', { name: 'Run' })
    await expect(runButton).toBeVisible()
    await expect(runButton).toHaveAttribute('aria-pressed', 'false')
    await runButton.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true })
    await expect(runButton).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().run)).toBe(true)
    await runButton.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true })
    await expect(runButton).toHaveAttribute('aria-pressed', 'false')
    expect(await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().run)).toBe(false)
    const emoteButton = page.getByRole('button', { name: 'Toggle emotes' })
    await expect(emoteButton).toBeVisible()
    await expect(emoteButton).toContainText('Emote')
    await emoteButton.click()
    await expect(emoteButton).toHaveAttribute('aria-pressed', 'true')
    await expect(emoteButton).toContainText('Wave')
    expect(await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().playerEmote)).toBe('wave')
    await expect(page.getByTestId('world-drag-control')).toBeVisible()
    await expect(page.getByTestId('mini-map')).toBeVisible()

    await page.getByRole('button', { name: 'Open town map' }).click()
    const mapPanel = page.getByTestId('world-map-panel')
    await expect(mapPanel).toBeVisible()
    await expect(mapPanel).toBeInViewport()
    await expect(page.getByTestId('map-marker-houses')).toBeVisible()
    await page.getByRole('button', { name: 'Close map' }).click()

    await page.evaluate(() => window.__blockBuddiesE2E!.prepareMovementInteraction())
    for (let step = 0; step < 7; step += 1) {
      await page.evaluate(() => window.__blockBuddiesE2E!.setMovementInput(0, 0, -80))
      await page.waitForTimeout(50)
    }
    const beforeForward = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition)
    await page.evaluate(() => window.__blockBuddiesE2E!.setMovementInput(1))
    await page.waitForTimeout(450)
    await page.evaluate(() => window.__blockBuddiesE2E!.setMovementInput(0))
    const afterForward = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition)
    expect(Math.hypot(afterForward[0] - beforeForward[0], afterForward[2] - beforeForward[2])).toBeGreaterThan(0.5)

    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Reset to Square' }).click()
    await expect.poll(async () => {
      const snapshot = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
      return JSON.stringify({
        position: snapshot.playerPosition.map((value) => Math.round(value * 10) / 10),
        emote: snapshot.playerEmote,
        interior: snapshot.interiorKind,
        miniGame: snapshot.miniGameStatus,
      })
    }).toBe(JSON.stringify({ position: [0, 0, 4], emote: 'none', miniGame: 'idle' }))

    await page.evaluate(() => window.__blockBuddiesE2E!.prepareHouseBedInteraction())
    await expect
      .poll(
        () => page.evaluate(() => JSON.stringify(window.__blockBuddiesE2E!.getGameplaySnapshot())),
        { timeout: 5000 },
      )
      .toContain('"interactionPrompt":"sleep"')
    const sleepAction = page.locator('.mobile-use-button[aria-label="Sleep"]')
    await expect(sleepAction).toBeVisible()
    await page.getByTestId('bed-action-button').click()
    const wakeAction = page.locator('.mobile-use-button[aria-label="Wake up"]')
    await expect(wakeAction).toBeVisible()
    const sleepingSnapshot = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
    expect(sleepingSnapshot.sleeping).toBe(true)
    expect(sleepingSnapshot.playerPosition[1]).toBeGreaterThan(0.7)
    expect(sleepingSnapshot.playerPosition[2]).toBeLessThan(2)
    await wakeAction.click()
    await expect(sleepAction).toBeVisible()
    const awakeSnapshot = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
    expect(awakeSnapshot.sleeping).toBe(false)
    expect(awakeSnapshot.playerPosition[0]).toBeLessThan(2)
    expect(awakeSnapshot.playerPosition[1]).toBeCloseTo(0, 1)
  })
})

test.describe('narrow portrait customizer layout', () => {
  test.use({
    viewport: { width: 576, height: 1024 },
    isMobile: true,
    hasTouch: true,
  })

  test('keeps the Body & Style preview clear of the category and colour grids', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start' }).click()
    await page.getByRole('button', { name: 'Customize' }).click()
    await expect(page.getByRole('heading', { name: 'Body & Style' })).toBeVisible()

    const bodyCustomizer = page.locator('.bb-customizer-body')
    const preview = bodyCustomizer.locator('.bb-avatar-turntable')
    const rail = bodyCustomizer.locator('.bb-body-section-rail')
    const controls = bodyCustomizer.locator('.bb-body-controls')
    const [previewBox, railBox, controlsBox] = await Promise.all([
      preview.boundingBox(),
      rail.boundingBox(),
      controls.boundingBox(),
    ])

    expect(previewBox).not.toBeNull()
    expect(railBox).not.toBeNull()
    expect(controlsBox).not.toBeNull()
    if (!previewBox || !railBox || !controlsBox) return

    expect(previewBox.y + previewBox.height).toBeLessThanOrEqual(railBox.y - 4)
    expect(railBox.y + railBox.height).toBeLessThanOrEqual(controlsBox.y - 4)
    expect(previewBox.x + previewBox.width).toBeLessThanOrEqual(576)
    expect(railBox.x + railBox.width).toBeLessThanOrEqual(576)
    expect(controlsBox.x + controlsBox.width).toBeLessThanOrEqual(576)
    await expect(bodyCustomizer.getByRole('button', { name: 'Body & Style' })).toBeInViewport()
    await expect(bodyCustomizer.getByRole('button', { name: 'Hair', exact: true })).toBeInViewport()
    await expect(bodyCustomizer.getByRole('button', { name: 'Face', exact: true })).toBeInViewport()
    await expect(bodyCustomizer.getByRole('button', { name: 'Colours', exact: true })).toBeInViewport()
    await expect(bodyCustomizer.getByRole('button', { name: 'Wardrobe', exact: true })).toBeInViewport()
    await expect(bodyCustomizer.getByText('Skin Tone')).toBeInViewport()
    await expect(bodyCustomizer.getByText('Accent Colour')).toBeInViewport()
  })
})

test('opens the town map and fast travels to a key place', async ({ page }) => {
  await page.goto('/')
  await completeStartFlow(page, 'MapRunner')

  const before = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
  await page.getByRole('button', { name: 'Open town map' }).click()
  await expect(page.getByTestId('world-map-panel')).toBeVisible()
  await expect(page.getByTestId('town-map')).toBeVisible()
  await expect(page.getByTestId('map-marker-school')).toBeVisible()
  await page.getByTestId('map-marker-school').click()
  await page.getByRole('button', { name: 'Travel to Skill School' }).click()

  await expect(page.getByTestId('world-map-panel')).toBeHidden()
  await expect.poll(async () => {
    const snapshot = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
    return {
      x: Math.round(snapshot.playerPosition[0] * 10) / 10,
      z: Math.round(snapshot.playerPosition[2] * 10) / 10,
      grounded: Math.abs(snapshot.playerPosition[1]) <= 0.15,
      teleported: snapshot.teleportSequence > before.teleportSequence,
    }
  }).toEqual({ x: -14, z: 14.9, grounded: true, teleported: true })
})

test('travels to the planned build and civic districts', async ({ page }) => {
  await page.goto('/')
  await completeStartFlow(page, 'TownPlanner')

  await page.getByRole('button', { name: 'Open town map' }).click()
  await expect(page.getByTestId('map-marker-builder')).toBeVisible()
  await page.getByTestId('map-marker-builder').click()
  await page.getByRole('button', { name: 'Travel to Builder Meadows' }).click()

  await expect.poll(async () => {
    const snapshot = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
    return {
      x: Math.round(snapshot.playerPosition[0]),
      z: Math.round(snapshot.playerPosition[2]),
    }
  }).toEqual({ x: 54, z: 54 })

  await page.getByRole('button', { name: 'Open town map' }).click()
  await expect(page.getByTestId('map-marker-hall')).toBeVisible()
  await page.getByTestId('map-marker-hall').click()
  await page.getByRole('button', { name: 'Travel to Clocktower Hall' }).click()

  await expect.poll(async () => {
    const snapshot = await page.evaluate(() => window.__blockBuddiesE2E!.getGameplaySnapshot())
    return {
      x: Math.round(snapshot.playerPosition[0] * 10) / 10,
      z: Math.round(snapshot.playerPosition[2] * 10) / 10,
    }
  }).toEqual({ x: 0, z: -28.5 })
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

  test('keeps the body customizer in a preview-first phone layout', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByRole('heading', { name: 'Customization Hub' })).toBeVisible()
    const hub = page.locator('.bb-customizer-hub')
    const hubStage = hub.locator('.bb-hub-stage')
    const hubLeftRail = hub.locator('.bb-hub-rail.left')
    const hubRightRail = hub.locator('.bb-hub-rail.right')
    await expect(hubStage.locator('.bb-game-avatar-preview')).toBeVisible()
    const [hubBox, hubStageBox, hubLeftBox, hubRightBox] = await Promise.all([
      hub.boundingBox(),
      hubStage.boundingBox(),
      hubLeftRail.boundingBox(),
      hubRightRail.boundingBox(),
    ])
    expect(hubBox).not.toBeNull()
    expect(hubStageBox).not.toBeNull()
    expect(hubLeftBox).not.toBeNull()
    expect(hubRightBox).not.toBeNull()
    if (!hubBox || !hubStageBox || !hubLeftBox || !hubRightBox) return
    expect(hubStageBox.y).toBeLessThan(hubLeftBox.y)
    expect(hubLeftBox.y).toBeLessThan(hubRightBox.y)
    expect(hubLeftBox.width / hubBox.width).toBeGreaterThan(0.86)
    expect(hubRightBox.width / hubBox.width).toBeGreaterThan(0.86)
    await expect(page.getByRole('button', { name: 'Customize' })).toBeInViewport()
    await page.getByRole('button', { name: 'Customize' }).click()
    await expect(page.getByRole('heading', { name: 'Body & Style' })).toBeVisible()

    const bodyCustomizer = page.locator('.bb-customizer-body')
    const rail = bodyCustomizer.locator('.bb-body-section-rail')
    const stage = bodyCustomizer.locator('.bb-body-stage')
    const controls = bodyCustomizer.locator('.bb-body-controls')
    const avatarTurn = stage.locator('.bb-avatar-turntable')
    await expect(stage.locator('.bb-game-avatar-preview')).toBeVisible()
    await expect(stage.locator('.bb-stage-glow')).toHaveCount(0)
    await expect(stage.locator('.bb-avatar-rotate')).toHaveCount(0)
    await expect(bodyCustomizer.getByText('Skin Tone')).toBeVisible()
    await expect(bodyCustomizer.getByText('Accent Colour')).toBeVisible()

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

    expect(stageBox.y).toBeLessThan(railBox.y)
    expect(railBox.y).toBeLessThan(controlsBox.y)
    expect(railBox.width / mainBox.width).toBeGreaterThan(0.86)
    expect(controlsBox.width / mainBox.width).toBeGreaterThan(0.86)
    expect(stageBox.x).toBeGreaterThanOrEqual(0)
    expect(railBox.x).toBeGreaterThanOrEqual(0)
    expect(controlsBox.x).toBeGreaterThanOrEqual(0)
    expect(stageBox.x + stageBox.width).toBeLessThanOrEqual(720)
    expect(railBox.x + railBox.width).toBeLessThanOrEqual(720)
    expect(controlsBox.x + controlsBox.width).toBeLessThanOrEqual(720)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(720)
    const avatarBox = await avatarTurn.boundingBox()
    expect(avatarBox).not.toBeNull()
    if (!avatarBox) return
    expect(avatarBox.y + avatarBox.height).toBeLessThanOrEqual(railBox.y - 4)
    await expect(bodyCustomizer.getByRole('button', { name: 'Hair', exact: true })).toBeInViewport()
    await expect(bodyCustomizer.getByRole('button', { name: 'Colours', exact: true })).toBeInViewport()

    const initialPreviewYaw = await avatarTurn.getAttribute('data-preview-yaw')
    await avatarTurn.dispatchEvent('pointerdown', { pointerId: 9, pointerType: 'touch', clientX: 220, clientY: 260, isPrimary: true })
    await avatarTurn.dispatchEvent('pointermove', { pointerId: 9, pointerType: 'touch', clientX: 300, clientY: 260, isPrimary: true })
    await avatarTurn.dispatchEvent('pointerup', { pointerId: 9, pointerType: 'touch', clientX: 300, clientY: 260, isPrimary: true })
    await expect.poll(() => avatarTurn.getAttribute('data-preview-yaw')).not.toBe(initialPreviewYaw)

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
