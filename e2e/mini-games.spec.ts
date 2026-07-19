import { expect, type Page, test } from '@playwright/test'

type MiniGameSnapshot = {
  miniGame: {
    activeId?: 'coin-rush' | 'delivery-dash' | 'hide-and-seek'
    status: 'idle' | 'running' | 'completed' | 'failed'
    score: number
    points: number
    target: number
    records: Record<
      string,
      {
        plays: number
        bestScore: number
        bestPoints?: number
        bestTime?: number
      }
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

    await startMiniGame(page, 'Play Coin Rush', /Coin Rush.*0\/8/)
    await expect(page.getByTestId('mini-game-announcement')).toContainText(
      'Coin Rush',
    )
    await expect(page.getByTestId('mini-game-announcement')).toContainText(
      'All players',
    )
    await expect(
      page.getByTestId('mini-game-announcement').locator('strong'),
    ).toContainText(/\d+s/)
    const started = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getSnapshot(),
    )
    expect(started.miniGame.activeId).toBe('coin-rush')
    expect(started.miniGame.score).toBe(0)
    expect(started.miniGame.points).toBe(0)
    expect(started.chatTexts).toContain(
      'Mini game started for all players: Coin Rush',
    )

    const firstCoin = await collectNextTarget(page)
    expect(firstCoin.miniGame.score).toBe(1)
    expect(firstCoin.miniGame.points).toBe(10)
    expect(firstCoin.coins).toBe(1)
    await expect(page.getByTestId('mini-game-hud')).toContainText('10 pts')
    await expect(
      page.locator('.desktop-hud').getByText('1').first(),
    ).toBeVisible()

    const snapshot = await completeMiniGameRoute(page)

    expect(snapshot.miniGame.status).toBe('completed')
    expect(snapshot.miniGame.records['coin-rush']).toMatchObject({
      plays: 1,
      bestScore: 8,
      bestPoints: 130,
    })
    expect(snapshot.coins).toBe(118)
    expect(snapshot.miniGame.points).toBe(130)
    expect(snapshot.earnedBadges).toContain('mini-game-star')
    expect(snapshot.chatTexts).toContain(
      'Coin Rush complete! 130 pts, +35 coins',
    )
    expect(snapshot.chatTexts).toContain('Win Coin Rush complete! +45 coins')
    expect(snapshot.chatTexts).toContain(
      'Coin Rush rewards paid: +111 coins (balance 118)',
    )
    expect(snapshot.chatTexts).toContain('Badge earned: Mini Game Star')
    expect(snapshot.chatTexts).toContain('Nice run in Coin Rush!')
    await expect(page.getByTestId('mini-game-hud')).toHaveCount(0)
    await expect(
      page.locator('.desktop-hud').getByText('118').first(),
    ).toBeVisible()
  })

  test('plays Delivery Dash in ordered stops and shows the next objective after each delivery', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'DashRunner')

    await startMiniGame(page, 'Play Delivery Dash', /Delivery Dash.*0\/4/)
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      'Pickup parcel',
    )
    await expect(page.getByTestId('mini-map-objective')).toBeVisible()
    await page.getByRole('button', { name: 'Open town map' }).click()
    await expect(page.getByTestId('town-map-objective')).toContainText(
      'Pickup parcel',
    )
    await expect(page.getByText('Active target: Pickup parcel')).toBeVisible()
    await page.getByRole('button', { name: 'Close map' }).click()
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            window
              .__blockBuddiesE2E!.getSnapshot()
              .chatTexts.some((text) =>
                text.startsWith('Delivery Dash: Pickup parcel'),
              ),
          ),
        { timeout: 15_000 },
      )
      .toBe(true)

    const pickup = await collectNextTarget(page)
    expect(pickup.miniGame.status).toBe('running')
    expect(pickup.miniGame.score).toBe(1)
    expect(pickup.miniGame.points).toBe(5)
    expect(pickup.coins).toBe(0)
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      /Delivery Dash.*1\/4/,
    )
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      'Deliver to Park',
    )
    expect(pickup.chatTexts).toContain('Parcel pickup collected! +5 pts (1/4)')

    const firstDropOff = await collectNextTarget(page)
    expect(firstDropOff.miniGame.score).toBe(2)
    expect(firstDropOff.miniGame.points).toBe(25)
    expect(firstDropOff.coins).toBe(8)
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      /Delivery Dash.*2\/4/,
    )
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      'Deliver to School',
    )
    expect(firstDropOff.chatTexts).toContain(
      'Park drop-off collected! +20 pts, +8 coins, +5s (2/4)',
    )

    const secondDropOff = await collectNextTarget(page)
    expect(secondDropOff.miniGame.score).toBe(3)
    expect(secondDropOff.coins).toBe(46)
    expect(secondDropOff.chatTexts).toContain(
      'Collect 10 coins complete! +30 coins',
    )
    await expect(page.getByTestId('mini-game-hud')).toContainText(
      'Deliver to Houses',
    )

    const finished = await collectNextTarget(page)
    expect(finished.miniGame.status).toBe('completed')
    expect(finished.miniGame.records['delivery-dash']).toMatchObject({
      plays: 1,
      bestScore: 4,
      bestPoints: 105,
    })
    expect(finished.coins).toBe(144)
    expect(finished.chatTexts).toContain(
      'Delivery Dash complete! 105 pts, +40 coins',
    )
    expect(finished.chatTexts).toContain(
      'Finish Delivery Dash complete! +50 coins',
    )
    expect(finished.chatTexts).toContain(
      'Delivery Dash rewards paid: +98 coins (balance 144)',
    )
    await expect(page.getByTestId('mini-game-hud')).toHaveCount(0)
  })

  test('plays Hide & Seek, finds all buddies, and preserves records in the panel', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'Seeker')

    await startMiniGame(page, 'Play Hide & Seek', /Hide & Seek.*0\/3/)
    await expect(page.getByTestId('mini-game-hud')).toContainText('LunaBlocks')

    const finished = await completeMiniGameRoute(page)

    expect(finished.miniGame.status).toBe('completed')
    expect(finished.miniGame.records['hide-and-seek']).toMatchObject({
      plays: 1,
      bestScore: 3,
      bestPoints: 100,
    })
    expect(finished.coins).toBe(155)
    expect(finished.chatTexts).toContain(
      'Hide & Seek complete! 100 pts, +50 coins',
    )
    expect(finished.chatTexts).toContain(
      'Visit Skill School complete! +20 coins',
    )
    expect(finished.chatTexts).toContain('Win Hide & Seek complete! +55 coins')

    await openMiniGamesPanel(page)
    await expect(page.getByText('Best 3/3')).toBeVisible()
    await expect(page.getByText('Plays 1')).toBeVisible()
  })

  test('cancels an active mini game from the panel without awarding rewards', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'CancelTester')

    await startMiniGame(page, 'Play Coin Rush', /Coin Rush.*0\/8/)
    await openMiniGamesPanel(page)
    await page.getByRole('button', { name: 'Cancel Mini Game' }).click()

    const snapshot = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getSnapshot(),
    )
    expect(snapshot.miniGame.status).toBe('idle')
    expect(snapshot.miniGame.records['coin-rush']).toBeUndefined()
    expect(snapshot.miniGame.points).toBe(0)
    expect(snapshot.coins).toBe(0)
    expect(snapshot.chatTexts).toContain('Mini game cancelled')
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
    await expect(page.getByTestId('mini-game-hud-mobile')).toContainText('0p')
    await expect(page.getByTestId('mini-game-announcement')).toContainText(
      'Coin Rush',
    )
    await expect(
      page.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Cancel', exact: true }).click()

    const snapshot = await page.evaluate(() =>
      window.__blockBuddiesE2E!.getSnapshot(),
    )
    expect(snapshot.miniGame.status).toBe('idle')
    expect(snapshot.coins).toBe(0)
    expect(
      await page.evaluate(
        () => window.__blockBuddiesE2E!.getGameplaySnapshot().chatTexts,
      ),
    ).toContain('Mini game cancelled')
    await expect(page.getByTestId('mini-game-hud-mobile')).toHaveCount(0)
  })
})
