import { expect, type Page, test } from '@playwright/test'

type MiniGameSnapshot = {
  miniGame: {
    activeId?: 'coin-rush' | 'delivery-dash' | 'hide-and-seek'
    status: 'idle' | 'running' | 'completed' | 'failed'
    score: number
    target: number
    records: Record<
      string,
      { plays: number; bestScore: number; bestTime?: number }
    >
  }
  coins: number
  earnedBadges: string[]
}

async function completeStartFlow(page: Page, name = 'MiniTester') {
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(
    page.getByRole('heading', { name: 'Customization Hub' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(
    page.getByRole('heading', { name: 'Name Your Buddy' }),
  ).toBeVisible()
  await page.getByLabel('Character name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
  await expect(
    page.evaluate(() => Boolean(window.__blockBuddiesE2E)),
  ).resolves.toBe(true)
}

async function openMiniGamesPanel(page: Page) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
  await page.getByRole('button', { name: 'Mini Games' }).click()
  await expect(
    page
      .getByTestId('mini-games-panel')
      .getByRole('heading', { name: 'Mini Games' }),
  ).toBeVisible()
}

async function startMiniGame(
  page: Page,
  buttonName: string,
  expectedHud: RegExp,
) {
  await openMiniGamesPanel(page)
  await page.getByRole('button', { name: buttonName }).click()
  await expect(page.getByTestId('mini-games-panel')).toHaveCount(0)
  await expect(page.getByTestId('mini-game-hud')).toContainText(expectedHud)
}

async function collectNextTarget(page: Page): Promise<MiniGameSnapshot> {
  return page.evaluate(() =>
    window.__blockBuddiesE2E!.collectNextMiniGameTarget(),
  )
}

async function completeMiniGameRoute(page: Page): Promise<MiniGameSnapshot> {
  return page.evaluate(() => window.__blockBuddiesE2E!.completeMiniGameRoute())
}

test.describe('mini games end-to-end flow', () => {
  test.setTimeout(90_000)

  test('plays Coin Rush from the menu, awards coins, records completion, and updates badges', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'CoinRunner')

    await startMiniGame(page, 'Play Coin Rush', /Coin Rush 0\/8/)
    await expect(
      page.getByText('Coin Rush started: Collect 8 event coins'),
    ).toBeVisible()
    const started = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getSnapshot(),
    )
    expect(started.miniGame.activeId).toBe('coin-rush')
    expect(started.miniGame.score).toBe(0)

    const snapshot = await completeMiniGameRoute(page)

    expect(snapshot.miniGame.status).toBe('completed')
    expect(snapshot.miniGame.records['coin-rush']).toMatchObject({
      plays: 1,
      bestScore: 8,
    })
    expect(snapshot.coins).toBe(35)
    expect(snapshot.earnedBadges).toContain('mini-game-star')
    await expect(page.getByText('Coin Rush complete! +35 coins')).toBeVisible()
    await expect(page.getByText('Badge earned: Mini Game Star')).toBeVisible()
    await expect(page.getByText('Nice run in Coin Rush!')).toBeVisible()
    await expect(page.getByTestId('mini-game-hud')).toHaveCount(0)
    await expect(
      page.locator('.desktop-hud').getByText('35').first(),
    ).toBeVisible()
  })

  test('plays Delivery Dash in ordered stops and shows the next objective after each delivery', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'DashRunner')

    await startMiniGame(page, 'Play Delivery Dash', /Delivery Dash 0\/3/)
    await expect(page.getByText('Delivery Dash: Park drop-off')).toHaveCount(1, { timeout: 15_000 })

    const first = await collectNextTarget(page)
    expect(first.miniGame.status).toBe('running')
    expect(first.miniGame.score).toBe(1)
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      'Delivery Dash 1/3',
    )
    await expect(page.getByText('Delivery Dash: School drop-off')).toHaveCount(
      1,
    )
    await expect(page.getByText('Park drop-off tagged! 1/3')).toBeVisible()

    const second = await collectNextTarget(page)
    expect(second.miniGame.score).toBe(2)
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      'Delivery Dash 2/3',
    )
    await expect(page.getByText('Delivery Dash: House drop-off')).toHaveCount(1)

    const finished = await collectNextTarget(page)
    expect(finished.miniGame.status).toBe('completed')
    expect(finished.miniGame.records['delivery-dash']).toMatchObject({
      plays: 1,
      bestScore: 3,
    })
    expect(finished.coins).toBe(45)
    await expect(
      page.getByText('Delivery Dash complete! +45 coins'),
    ).toBeVisible()
    await expect(page.getByTestId('mini-game-hud')).toHaveCount(0)
  })

  test('plays Hide & Seek, finds all buddies, and preserves records in the panel', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'Seeker')

    await startMiniGame(page, 'Play Hide & Seek', /Hide & Seek 0\/3/)
    await expect(page.getByText('Hide & Seek: LunaBlocks')).toHaveCount(1)
    await expect(page.getByText('Hide & Seek: MaxJumps')).toHaveCount(1)
    await expect(page.getByText('Hide & Seek: PipPop')).toHaveCount(1)

    const finished = await completeMiniGameRoute(page)

    expect(finished.miniGame.status).toBe('completed')
    expect(finished.miniGame.records['hide-and-seek']).toMatchObject({
      plays: 1,
      bestScore: 3,
    })
    expect(finished.coins).toBe(50)
    await expect(
      page.getByText('Hide & Seek complete! +50 coins'),
    ).toBeVisible()

    await openMiniGamesPanel(page)
    await expect(page.getByText('Best 3/3')).toBeVisible()
    await expect(page.getByText('Plays 1')).toBeVisible()
  })

  test('cancels an active mini game from the panel without awarding rewards', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'CancelTester')

    await startMiniGame(page, 'Play Coin Rush', /Coin Rush 0\/8/)
    await openMiniGamesPanel(page)
    await page.getByRole('button', { name: 'Cancel Mini Game' }).click()

    const snapshot = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getSnapshot(),
    )
    expect(snapshot.miniGame.status).toBe('idle')
    expect(snapshot.miniGame.records['coin-rush']).toBeUndefined()
    expect(snapshot.coins).toBe(0)
    await expect(page.getByText('Mini game cancelled')).toBeVisible()
    await expect(page.getByTestId('mini-game-hud')).toHaveCount(0)
  })
})

test.describe('mobile mini game controls', () => {
  test.setTimeout(90_000)

  test.use({
    viewport: { width: 1280, height: 576 },
    isMobile: true,
    hasTouch: true,
  })

  test('shows mobile mini-game progress and lets the player cancel with the center control', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'PhoneMini')

    await startMiniGame(page, 'Play Coin Rush', /0\/8/)
    await expect(page.getByTestId('mini-game-hud-mobile')).toContainText('0/8')
    await expect(
      page.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Cancel', exact: true }).click()

    const snapshot = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getSnapshot(),
    )
    expect(snapshot.miniGame.status).toBe('idle')
    expect(snapshot.coins).toBe(0)
    await page.locator('.mobile-chat-button').click()
    await expect(
      page.locator('.mobile-chat-drawer').getByText('Mini game cancelled'),
    ).toBeVisible()
    await expect(page.getByTestId('mini-game-hud-mobile')).toHaveCount(0)
  })
})
