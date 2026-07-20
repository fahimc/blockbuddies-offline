import { expect, type Page, test } from '@playwright/test'

type LocalPartySnapshot = {
  playerId: string
  playerName: string
  status: 'idle' | 'hosting' | 'joining' | 'connecting' | 'connected' | 'error'
  inviteCode: string
  answerCode: string
  answerCodeInput: string
  remotePlayers: {
    id: string
    name: string
    position: [number, number, number]
    emote: string
    savedFriends?: {
      id: string
      name: string
      inWorld: boolean
      route: string[]
    }[]
    placedBlocks?: {
      id: string
      kind?: string
      position: [number, number, number]
      color: string
      rotation?: number
    }[]
    kart?: {
      id: string
      position: [number, number, number]
      yaw: number
      speed: number
    }
    kartRace?: { raceId?: string; status: string; lap: number }
  }[]
  lastEvent: string
  error?: string
}

async function completeStartFlow(page: Page, name: string) {
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

async function openLocalPartyPanel(page: Page) {
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await expect(page.locator('.bb-game-menu-drawer')).toBeVisible()
  await page.getByRole('button', { name: 'Local Party' }).click()
  await expect(page.getByRole('heading', { name: 'Local Party' })).toBeVisible()
}

async function partySnapshot(page: Page): Promise<LocalPartySnapshot> {
  return page.evaluate(() => window.__blockBuddiesE2E!.getLocalPartySnapshot())
}

async function waitForPartyStatus(
  page: Page,
  status: LocalPartySnapshot['status'],
) {
  await expect
    .poll(
      async () => {
        const snapshot = await partySnapshot(page)
        if (snapshot.error) return `error:${snapshot.error}`
        return snapshot.status
      },
      { timeout: 20_000 },
    )
    .toBe(status)
}

async function waitForGeneratedCode(
  page: Page,
  kind: 'inviteCode' | 'answerCode',
) {
  await expect
    .poll(
      async () => {
        const snapshot = await partySnapshot(page)
        return snapshot[kind].length
      },
      { timeout: 20_000 },
    )
    .toBeGreaterThan(40)
  return (await partySnapshot(page))[kind]
}

async function runSynchronizedKartRace(host: Page, guest: Page) {
  for (const player of [host, guest]) {
    const closeMessages = player.getByRole('button', {
      name: 'Close messages',
    })
    if (await closeMessages.isVisible().catch(() => false))
      await closeMessages.click()
  }

  await host.getByRole('button', { name: 'Menu' }).click()
  await host.getByRole('button', { name: 'Go Kart Racing' }).click()
  await expect(
    host.getByRole('heading', { name: 'Buddy Kart Circuit' }),
  ).toBeVisible()
  await host.getByRole('button', { name: 'Play Go Karts' }).click()

  await expect
    .poll(
      async () => {
        const remote = (await partySnapshot(guest)).remotePlayers.find(
          (player) => player.name === 'HostBuddy',
        )
        return remote?.kart?.id
      },
      { timeout: 15_000 },
    )
    .toBe('go-kart:red')

  await guest.getByRole('button', { name: 'Menu' }).click()
  await guest.getByRole('button', { name: 'Go Kart Racing' }).click()
  await expect(
    guest.getByRole('radio', { name: 'Red Rocket - in use' }),
  ).toBeDisabled()
  await guest.getByRole('radio', { name: 'Blue Bolt' }).click()
  await guest.getByRole('button', { name: 'Play Go Karts' }).click()
  await expect
    .poll(
      async () =>
        (await host.getByTestId('start-kart-race').count()) +
        (await guest.getByTestId('start-kart-race').count()),
      { timeout: 15_000 },
    )
    .toBe(1)
  const hostStarts = (await host.getByTestId('start-kart-race').count()) === 1
  const raceStarter = hostStarts ? host : guest
  const waitingRacer = hostStarts ? guest : host
  await expect(waitingRacer.getByText('Waiting for host')).toBeVisible()
  await raceStarter.getByTestId('start-kart-race').click()

  await expect
    .poll(
      async () => {
        const hostRace = await host.evaluate(
          () => window.__blockBuddiesE2E!.getGameplaySnapshot().kartRace,
        )
        const guestRace = await guest.evaluate(
          () => window.__blockBuddiesE2E!.getGameplaySnapshot().kartRace,
        )
        return `${hostRace.raceId}:${guestRace.raceId}`
      },
      { timeout: 15_000 },
    )
    .toMatch(/^(.+):\1$/)
  await expect
    .poll(
      async () => {
        const remote = (await partySnapshot(host)).remotePlayers.find(
          (player) => player.name === 'GuestBuddy',
        )
        return remote?.kart?.id
      },
      { timeout: 15_000 },
    )
    .toBe('go-kart:blue')
}

test.describe('local party multiplayer', () => {
  test.setTimeout(150_000)

  test('connects two local players with manual WebRTC codes and exchanges player snapshots', async ({
    page: host,
  }) => {
    const guest = await host.context().newPage()

    await host.goto('/')
    await guest.goto('/')
    await completeStartFlow(host, 'HostBuddy')
    await completeStartFlow(guest, 'GuestBuddy')

    await openLocalPartyPanel(host)
    await openLocalPartyPanel(guest)

    await host.getByText('Manual code fallback').click()
    await guest.getByText('Manual code fallback').click()

    await host.getByRole('button', { name: 'Host Local Party' }).click()
    const inviteCode = await waitForGeneratedCode(host, 'inviteCode')
    await expect(host.getByLabel('Host invite code preview')).toContainText(
      'chars',
    )

    await guest.getByLabel('Join with invite code').fill(inviteCode)
    await guest.getByRole('button', { name: 'Create Join Answer' }).click()
    const answerCode = await waitForGeneratedCode(guest, 'answerCode')
    await expect(guest.getByLabel('Join answer code preview')).toContainText(
      'chars',
    )

    await host.getByLabel('Accept join answer').fill(answerCode)
    await host.getByRole('button', { name: 'Accept Join Answer' }).click()

    await waitForPartyStatus(host, 'connected')
    await waitForPartyStatus(guest, 'connected')
    await expect(host.locator('.bb-party-status.connected')).toBeVisible()
    await expect(guest.locator('.bb-party-status.connected')).toBeVisible()

    await guest.evaluate(() =>
      window.__blockBuddiesE2E!.broadcastLocalPartySnapshot(
        [4, 0, 7],
        undefined,
        'dance',
      ),
    )
    await expect
      .poll(
        async () =>
          (await partySnapshot(host)).remotePlayers.map(
            (player) => player.name,
          ),
        {
          timeout: 15_000,
        },
      )
      .toContain('GuestBuddy')
    await expect
      .poll(
        async () => {
          const guestRemote = (await partySnapshot(host)).remotePlayers.find(
            (player) => player.name === 'GuestBuddy',
          )
          return guestRemote?.emote
        },
        {
          timeout: 15_000,
        },
      )
      .toBe('dance')
    await expect(host.getByText('Local players connected: 1')).toBeVisible()
    await expect(
      host.locator('.bb-party-card').locator('span', { hasText: 'GuestBuddy' }),
    ).toBeVisible()

    await guest.evaluate(() =>
      window.__blockBuddiesE2E!.createLocalPartyFriend('Party Pal'),
    )
    await expect
      .poll(
        async () => {
          const guestRemote = (await partySnapshot(host)).remotePlayers.find(
            (player) => player.name === 'GuestBuddy',
          )
          return (
            guestRemote?.savedFriends?.map(
              (friend) => `${friend.name}:${friend.inWorld}`,
            ) ?? []
          )
        },
        {
          timeout: 15_000,
        },
      )
      .toContain('Party Pal:true')

    await host.evaluate(() =>
      window.__blockBuddiesE2E!.broadcastLocalPartySnapshot(
        [-3, 0, 5],
        [
          {
            id: 'e2e-party-house',
            kind: 'house',
            position: [67, 0, 54],
            color: '#60a5fa',
            rotation: 0,
          },
        ],
      ),
    )
    await expect
      .poll(
        async () =>
          (await partySnapshot(guest)).remotePlayers.map(
            (player) => player.name,
          ),
        {
          timeout: 15_000,
        },
      )
      .toContain('HostBuddy')
    await expect(guest.getByText('Local players connected: 1')).toBeVisible()
    await expect(
      guest.locator('.bb-party-card').locator('span', { hasText: 'HostBuddy' }),
    ).toBeVisible()

    const hostRemote = (await partySnapshot(host)).remotePlayers[0]
    expect(hostRemote.name).toBe('GuestBuddy')
    expect(hostRemote.position).toHaveLength(3)
    expect(hostRemote.position.every((value) => Number.isFinite(value))).toBe(
      true,
    )

    await expect
      .poll(
        async () => {
          const guestRemote = (await partySnapshot(guest)).remotePlayers.find(
            (player) => player.name === 'HostBuddy',
          )
          return guestRemote?.placedBlocks?.map((block) => block.id) ?? []
        },
        {
          timeout: 15_000,
        },
      )
      .toContain('e2e-party-house')
    await expect
      .poll(
        async () => {
          const snapshot = await guest.evaluate(() =>
            window.__blockBuddiesE2E!.getGameplaySnapshot(),
          )
          return snapshot.placedBlocks.map((block) => block.id)
        },
        {
          timeout: 15_000,
        },
      )
      .toContain('e2e-party-house')

    const guestParty = await partySnapshot(guest)
    await host.evaluate(
      ({ playerId, playerName }) => {
        window.__blockBuddiesE2E!.openLocalPartyMessageThread(
          playerId,
          playerName,
        )
        window.__blockBuddiesE2E!.sendSelectedPredefinedMessage('greeting-001')
      },
      { playerId: guestParty.playerId, playerName: guestParty.playerName },
    )
    await expect
      .poll(
        async () => {
          const snapshot = await guest.evaluate(() =>
            window.__blockBuddiesE2E!.getGameplaySnapshot(),
          )
          const hostThread = snapshot.messageThreads.find(
            (thread) => thread.botName === 'HostBuddy',
          )
          return (
            hostThread?.messages.map(
              (message) => `${message.from}:${message.text}:${message.read}`,
            ) ?? []
          )
        },
        {
          timeout: 15_000,
        },
      )
      .toContain('bot:Hi!:false')

    await runSynchronizedKartRace(host, guest)

    await guest.close()
  })
})
