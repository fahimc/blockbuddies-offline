import { expect, test, type Locator, type Page } from '@playwright/test'

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
    const preview = hub.locator('.bb-hub-preview')
    const nameEditor = hub.locator('.bb-character-name-editor')
    const savedStrip = hub.locator('.bb-saved-character-strip')
    const categories = hub.locator('.bb-hub-category-grid')
    const footer = page.locator('.bb-customizer-footer')
    const hubBox = await requiredBox(hub)
    const previewBox = await requiredBox(preview)
    const nameBox = await requiredBox(nameEditor)
    const savedBox = await requiredBox(savedStrip)
    const categoryBox = await requiredBox(categories)
    const hubFooterBox = await requiredBox(footer)

    expect(previewBox.y).toBeGreaterThanOrEqual(hubBox.y)
    expect(nameBox.y).toBeGreaterThanOrEqual(previewBox.y + previewBox.height)
    expect(savedBox.y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height)
    expect(categoryBox.y).toBeGreaterThanOrEqual(savedBox.y + savedBox.height)
    expect(categoryBox.y + categoryBox.height).toBeLessThanOrEqual(
      hubFooterBox.y,
    )
    expect(categoryBox.width / hubBox.width).toBeGreaterThan(0.92)
    await expectChildrenFit(savedStrip, 'button')
    await expectChildrenFit(categories, 'button')
    await expectWithinViewport(footer, page)
    await expect(categories.getByRole('button', { name: 'Skin' })).toBeVisible()
    await expect(
      categories.getByRole('button', { name: 'Trails' }),
    ).toBeVisible()
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

  test('keeps body, accessories, and emotes in the four-column mobile layout', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start' }).click()
    await page.evaluate(() => document.fonts.ready)

    await page.getByRole('button', { name: 'Customize' }).click()
    await expect(
      page.getByRole('heading', { name: 'Body & Style' }),
    ).toBeVisible()

    const body = page.locator('.bb-customizer-body')
    const bodyStage = await requiredBox(body.locator('.bb-body-stage'))
    const bodyCategories = await requiredBox(
      body.locator('.bb-body-section-rail'),
    )
    const bodyControls = await requiredBox(body.locator('.bb-body-controls'))
    expect(bodyStage.y + bodyStage.height).toBeLessThanOrEqual(bodyCategories.y)
    expect(bodyCategories.y + bodyCategories.height).toBeLessThanOrEqual(
      bodyControls.y,
    )
    await expect(page).toHaveScreenshot(
      'customizer-body-portrait.png',
      screenshotOptions,
    )

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Clothing' })).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Hats & Accessories' }),
    ).toBeVisible()

    const accessories = page.locator('.bb-customizer-accessories')
    const accessoryStage = await requiredBox(
      accessories.locator('.bb-accessory-stage'),
    )
    const accessoryCatalog = await requiredBox(
      accessories.locator('.bb-custom-catalog'),
    )
    expect(accessoryStage.y + accessoryStage.height).toBeLessThanOrEqual(
      accessoryCatalog.y,
    )
    await expect(page).toHaveScreenshot(
      'customizer-accessories-portrait.png',
      screenshotOptions,
    )

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Emotes & Animations' }),
    ).toBeVisible()

    const emotes = page.locator('.bb-customizer-emotes')
    const emotePreview = await requiredBox(emotes.locator('.bb-emote-preview'))
    const emoteCategories = await requiredBox(
      emotes.getByRole('navigation', { name: 'Customization categories' }),
    )
    const emoteCatalog = await requiredBox(emotes.locator('.bb-custom-catalog'))
    const quickPreview = await requiredBox(emotes.locator('.bb-quick-preview'))
    expect(emotePreview.y + emotePreview.height).toBeLessThanOrEqual(
      emoteCategories.y,
    )
    expect(emoteCategories.y + emoteCategories.height).toBeLessThanOrEqual(
      emoteCatalog.y,
    )
    expect(emoteCatalog.y + emoteCatalog.height).toBeLessThanOrEqual(
      quickPreview.y,
    )
    await expectChildrenFit(
      emotes.getByRole('navigation', { name: 'Customization categories' }),
      'button',
    )
    await expectWithinViewport(page.locator('.bb-customizer-footer'), page)
    await expect(page).toHaveScreenshot(
      'customizer-emotes-portrait.png',
      screenshotOptions,
    )
  })

  test('keeps the illustrated club, bus, and work tutorial readable in portrait', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'TutorialGuide')
    await page.getByRole('button', { name: 'Start Playing' }).click()
    await hideGameCanvas(page)
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Tutorial', exact: true }).click()

    const panel = page.locator('.bb-panel')
    const panelBody = panel.locator('.bb-panel-body')
    await expect(panel).toBeVisible()
    await expectWithinViewport(panel, page)
    await expect(
      panel.getByRole('img', { name: /purple Buddy Rush clubhouse/i }),
    ).toBeVisible()
    await expect(
      panel.getByRole('heading', { name: 'Your Club & Buddy Rush' }),
    ).toBeVisible()
    await expect(page).toHaveScreenshot('tutorial-club-portrait.png', {
      ...screenshotOptions,
      mask: buddyRushScreenshotMasks(page),
    })

    await panelBody.evaluate((element) => {
      const workImage = Array.from(
        element.querySelectorAll('[role="img"]'),
      ).find((image) =>
        image
          .getAttribute('aria-label')
          ?.startsWith('Illustration of the four workplaces'),
      )
      workImage?.scrollIntoView({ block: 'start' })
    })
    await expect(
      panel.getByRole('img', {
        name: /four workplaces.*three-task route/i,
      }),
    ).toBeVisible()
    await expect(panel.getByText('Shopkeeper')).toBeVisible()
    await expect(panel.getByText('Farming')).toBeVisible()
    await expect(
      panel.getByRole('button', { name: 'Open Jobs & Work' }),
    ).toBeVisible()
    await expect(page).toHaveScreenshot('tutorial-work-portrait.png', {
      ...screenshotOptions,
      mask: buddyRushScreenshotMasks(page),
    })
  })

  test('keeps Buddy Rush recruitment and BuddyBook readable in portrait', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'VisualRush')
    await page.getByRole('button', { name: 'Start Playing' }).click()
    await hideGameCanvas(page)
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Buddy Rush', exact: true }).click()

    const panel = page.locator('.bb-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Buddy Bus Stop')).toBeVisible()
    await expect(page).toHaveScreenshot('buddy-rush-bus-portrait.png', {
      ...screenshotOptions,
      mask: [
        panel.getByText(/Protected \d/),
        panel.getByText(/Visitors leave in/),
      ],
    })

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('protected'),
    )
    await panel.getByRole('button', { name: 'BuddyBook' }).click()
    await expect(panel.getByText('2/12 discovered')).toBeVisible()
    await expect(panel.getByText('Undiscovered')).toHaveCount(10)
    await expect(page).toHaveScreenshot('buddy-rush-book-portrait.png', {
      ...screenshotOptions,
      mask: [panel.getByText(/Protected \d/)],
    })
  })

  test('covers Buddy Rush shield, warning, capture, chase, rescue, and reduced-motion states', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.goto('/')
    await completeStartFlow(page, 'RushStates')
    await page.getByRole('button', { name: 'Start Playing' }).click()
    await hideGameCanvas(page)

    for (const phase of ['protected', 'warning', 'recovery'] as const) {
      await page.evaluate(
        (nextPhase) =>
          window.__blockBuddiesE2E!.prepareBuddyRushVisualState(nextPhase),
        phase,
      )
      const shield = page.getByRole('button', {
        name: new RegExp(`Buddy Rush, shield ${phase}`),
      })
      await expect(shield).toBeVisible()
      await expect(shield).toHaveScreenshot(
        `buddy-rush-shield-${phase}-portrait.png`,
        {
          ...screenshotOptions,
          mask: [page.getByTestId('buddy-rush-shield-time')],
        },
      )
    }

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('warning'),
    )
    await expect(page.getByRole('status')).toContainText(
      'Clubhouse Shield warning',
    )
    await expect(page).toHaveScreenshot('buddy-rush-warning-portrait.png', {
      ...screenshotOptions,
      mask: buddyRushScreenshotMasks(page),
    })

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('capture'),
    )
    await expect(page.getByTestId('buddy-rush-active-hud')).toContainText(
      'Hold the badge',
    )
    await expect(page).toHaveScreenshot('buddy-rush-capture-portrait.png', {
      ...screenshotOptions,
      mask: buddyRushScreenshotMasks(page),
    })

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('chase'),
    )
    await expect(page.getByTestId('buddy-rush-active-hud')).toContainText(
      'tag the rival',
    )
    await expect(page).toHaveScreenshot('buddy-rush-chase-portrait.png', {
      ...screenshotOptions,
      mask: buddyRushScreenshotMasks(page),
    })

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('rescue'),
    )
    await page.getByRole('button', { name: 'Rescue Quest' }).click()
    await page
      .locator('.bb-panel')
      .getByRole('button', { name: 'Rush', exact: true })
      .click()
    await expect(page.locator('.bb-panel')).toContainText('Active Rescue Quest')
    await expect(page).toHaveScreenshot('buddy-rush-rescue-portrait.png', {
      ...screenshotOptions,
      mask: buddyRushScreenshotMasks(page),
    })
    await page.getByRole('button', { name: 'Close' }).click()

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('chase', true),
    )
    await expect(page.getByTestId('buddy-rush-active-hud')).toBeVisible()
    await expect(page).toHaveScreenshot(
      'buddy-rush-chase-reduced-motion-portrait.png',
      {
        ...screenshotOptions,
        mask: buddyRushScreenshotMasks(page),
      },
    )
  })
})

test.describe('Buddy Rush desktop visual regression', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('keeps the chase HUD and management panel readable on desktop', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.goto('/')
    await completeStartFlow(page, 'RushDesktop')
    await page.getByRole('button', { name: 'Start Playing' }).click()
    await hideGameCanvas(page)
    await page.addStyleTag({
      content:
        '[data-testid="buddy-rush-active-hud"] { background-color: #020617 !important; backdrop-filter: none !important; }',
    })
    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushVisualState('chase'),
    )
    const activeHud = page.getByTestId('buddy-rush-active-hud')
    await expect(activeHud).toBeVisible()
    await expect(activeHud).toHaveScreenshot(
      'buddy-rush-chase-hud-desktop.png',
      {
        ...screenshotOptions,
        mask: [page.getByTestId('buddy-rush-raid-time')],
      },
    )
    await page.getByRole('button', { name: /Buddy Rush, shield rush/ }).click()
    const panel = page.locator('.bb-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toHaveScreenshot('buddy-rush-panel-desktop.png', {
      ...screenshotOptions,
      mask: [
        page.getByTestId('buddy-rush-panel-shield-time'),
        page.getByTestId('buddy-rush-panel-rush-time'),
      ],
    })
  })
})

const screenshotOptions = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
  maxDiffPixelRatio: 0.004,
  timeout: 15_000,
}

function buddyRushScreenshotMasks(page: Page) {
  return [
    page.getByTestId('buddy-rush-shield-time'),
    page.getByTestId('buddy-rush-warning-time'),
    page.getByTestId('buddy-rush-raid-time'),
    page.getByTestId('buddy-rush-panel-shield-time'),
    page.getByTestId('buddy-rush-panel-rush-time'),
  ]
}

async function hideGameCanvas(page: Page) {
  await page.locator('canvas').evaluateAll((canvases) => {
    canvases.forEach((canvas) => {
      canvas.style.visibility = 'hidden'
    })
  })
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('Expected visible layout box')
  return box
}

async function expectChildrenFit(container: Locator, selector: string) {
  const fit = await container.evaluate((element, childSelector) => {
    const parentBox = element.getBoundingClientRect()
    return Array.from(element.querySelectorAll(childSelector)).every(
      (child) => {
        const childBox = child.getBoundingClientRect()
        return (
          childBox.left >= parentBox.left - 0.5 &&
          childBox.right <= parentBox.right + 0.5 &&
          childBox.top >= parentBox.top - 0.5 &&
          childBox.bottom <= parentBox.bottom + 0.5
        )
      },
    )
  }, selector)
  expect(fit).toBe(true)
}

async function expectWithinViewport(locator: Locator, page: Page) {
  const box = await requiredBox(locator)
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Expected viewport')
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
}

async function completeStartFlow(page: Page, name: string) {
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
