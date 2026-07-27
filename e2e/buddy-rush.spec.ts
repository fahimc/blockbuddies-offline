import { expect, test, type Page } from '@playwright/test'

async function completeStartFlow(page: Page, name = 'RushTester') {
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
  await page.getByLabel('Character name').fill(name)
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page.getByTestId('game-canvas')).toBeVisible()
  const startPlaying = page.getByRole('button', { name: 'Start Playing' })
  if (await startPlaying.isVisible()) await startPlaying.click()
}

async function openBuddyRush(page: Page) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
  await page.getByRole('button', { name: 'Buddy Rush', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Buddy Rush' })).toBeVisible()
}

test.describe('Buddy Rush first-playable loop', () => {
  test.setTimeout(120_000)
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  test('recruits and places a Buddy, then exposes the safety settings', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page)
    await openBuddyRush(page)

    await expect(page.getByText('Visitors leave in')).toBeVisible()
    await page
      .getByRole('button', { name: /BoltBot everyday.*Challenge/i })
      .click()
    await expect(
      page.getByText(
        'BoltBot has three loose wires. Which tool safely tightens a screw?',
      ),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Toy hammer' }).click()
    await expect(page.getByRole('status')).toContainText('practice coins')
    await page.getByRole('button', { name: 'Screwdriver' }).click()
    await expect(page.getByText('1/12')).toBeVisible()
    await expect(page.getByText('8%')).toBeVisible()

    await page.getByRole('button', { name: 'Clubhouse', exact: true }).click()
    const activity = page.getByRole('combobox', {
      name: 'Activity for BoltBot',
    })
    await activity.selectOption('clubhouse-arcade')
    await expect(activity).toHaveValue('clubhouse-arcade')
    await expect(page.getByText(/coins\/min/)).not.toContainText('0.0')
    await expect(page.getByText('1/4 assigned')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await openBuddyRush(page)
    await page.getByRole('button', { name: 'BuddyBook', exact: true }).click()
    await expect(page.getByText('1/12 discovered')).toBeVisible()
    await expect(
      page.locator('.bb-panel').getByText('BoltBot', { exact: true }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const reducedMotion = page.getByRole('checkbox', {
      name: 'Reduced Motion',
    })
    await page
      .locator('label.bb-setting-row')
      .filter({ has: reducedMotion })
      .click()
    await expect(reducedMotion).toBeChecked()

    const mode = page.getByRole('combobox', { name: 'Buddy Rush Mode' })
    await mode.selectOption('reduced-tension')
    await expect(mode).toHaveValue('reduced-tension')
    const enabled = page.getByRole('checkbox', { name: 'Buddy Rush' })
    await page.locator('label.bb-setting-row').filter({ has: enabled }).click()
    await expect(enabled).not.toBeChecked()
    await expect(mode).toBeDisabled()
  })

  test('completes defence, escape, rescue, player raid, and safe resume flows', async ({
    page,
  }) => {
    await page.goto('/')
    await completeStartFlow(page, 'LoopTester')

    const defence = await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushDefence(),
    )
    expect(defence.buddyRush.activeRaid).toMatchObject({
      direction: 'defend',
      phase: 'chase',
    })
    await expect(page.getByTestId('buddy-rush-active-hud')).toContainText(
      /tag the rival/i,
    )
    await expect(page.getByTestId('buddy-rush-following-buddy')).toHaveCount(1)
    await expect(page.getByTestId('buddy-rush-following-buddy')).toContainText(
      'following',
    )

    const defended = await page.evaluate(() =>
      window.__blockBuddiesE2E!.finishBuddyRushDefence(),
    )
    expect(defended.buddyRush.activeRaid).toBeUndefined()
    expect(defended.buddyRush.shield.phase).toBe('recovery')
    expect(defended.earnedBadges).toContain('rush-rescuer')

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushDefence(),
    )
    const escaped = await page.evaluate(() =>
      window.__blockBuddiesE2E!.letBuddyRushRivalEscape(),
    )
    expect(escaped.buddyRush.rescueQuest).toBeDefined()
    expect(
      escaped.buddyRush.ownedBuddies.some((buddy) => buddy.visitState),
    ).toBe(true)
    await expect(
      page.getByRole('button', { name: 'Rescue Quest' }),
    ).toBeVisible()

    const rescued = await page.evaluate(() =>
      window.__blockBuddiesE2E!.completeBuddyRushRescue(),
    )
    expect(rescued.buddyRush.rescueQuest).toBeUndefined()
    expect(
      rescued.buddyRush.ownedBuddies.every((buddy) => !buddy.visitState),
    ).toBe(true)

    await openBuddyRush(page)
    await page.getByRole('button', { name: 'Rush', exact: true }).click()
    const moonlight = page
      .locator('article')
      .filter({ hasText: 'Moonlight Club' })
    await moonlight.getByRole('button', { name: 'Start friendly Rush' }).click()
    const hold = page.getByRole('button', {
      name: 'Hold for 2 seconds to capture Friendship Badge',
    })
    await hold.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
    })
    await page.waitForTimeout(2_100)
    await expect(page.getByTestId('buddy-rush-active-hud')).toContainText(
      /Escort .* back to your clubhouse/i,
    )
    await expect(page.getByTestId('buddy-rush-following-buddy')).toHaveCount(1)
    const beforeBlockedTravel = await page.evaluate(
      () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
    )
    await openBuddyRush(page)
    await page.getByRole('button', { name: 'Clubhouse', exact: true }).click()
    await page.getByRole('button', { name: 'Visit clubhouse' }).click()
    const afterBlockedTravel = await page.evaluate(
      () => window.__blockBuddiesE2E!.getGameplaySnapshot().playerPosition,
    )
    expect(afterBlockedTravel).toEqual(beforeBlockedTravel)

    const playerEscape = await page.evaluate(() =>
      window.__blockBuddiesE2E!.completePlayerBuddyRushEscape(),
    )
    expect(playerEscape.buddyRush.activeRaid).toBeUndefined()
    expect(playerEscape.buddyRush.visitors).toHaveLength(1)

    await page.evaluate(() =>
      window.__blockBuddiesE2E!.prepareBuddyRushDefence(),
    )
    await page.waitForTimeout(900)
    await page.reload()
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByTestId('game-canvas')).toBeVisible()
    const resumed = await page.evaluate(
      () => window.__blockBuddiesE2E!.getGameplaySnapshot().buddyRush,
    )
    expect(resumed.activeRaid).toBeUndefined()
    expect(resumed.shield.phase).toBe('recovery')
    expect(resumed.ownedBuddies).toHaveLength(2)
  })
})
