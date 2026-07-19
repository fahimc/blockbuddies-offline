import { expect, test, type Locator, type Page } from '@playwright/test'

async function enterWorld(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Next: Trails' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()
  await page.getByLabel('Character name').fill('DragTester')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.getByTestId('game-canvas').waitFor()
  await page.getByRole('button', { name: 'Start Playing' }).click()
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__blockBuddiesE2E
          ?.getGameplaySnapshot()
          .chatTexts.includes('Local server started'),
      ),
    )
    .toBe(true)
}

async function dragNpc(page: Page, target: Locator) {
  await expect(target).toBeVisible()
  const bounds = await target.boundingBox()
  expect(bounds).not.toBeNull()
  const startX = bounds!.x + bounds!.width / 2
  const startY = bounds!.y + bounds!.height / 2

  await target.dispatchEvent('pointerdown', {
    bubbles: true,
    button: 0,
    buttons: 1,
    clientX: startX,
    clientY: startY,
    pointerId: 1,
    pointerType: 'mouse',
  })
  await page.mouse.move(startX + 90, startY + 25, { steps: 8 })
  await expect(page.getByTestId('npc-drag-indicator')).toBeVisible()
  await page.mouse.up()
  await expect(page.getByTestId('npc-drag-indicator')).toHaveCount(0)
}

test('drags NPCs in gameplay without moving the local player', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await enterWorld(page)

  const before = await page.evaluate(() =>
    window.__blockBuddiesE2E!.prepareNpcDragInteraction(),
  )
  const friendBefore = before.savedFriends.find(
    (friend) => friend.name === 'Drag Buddy',
  )!
  const botBefore = before.bots[0]!

  await expect(page.getByTitle('Drag DragTester to move them')).toHaveCount(0)

  await dragNpc(page, page.getByRole('button', { name: 'Select LunaBlocks' }))
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window
            .__blockBuddiesE2E!.getGameplaySnapshot()
            .bots.find((bot) => bot.id === 'luna')?.position,
      ),
    )
    .not.toEqual(botBefore.position)

  const afterBot = await page.evaluate(() =>
    window.__blockBuddiesE2E!.getGameplaySnapshot(),
  )
  expect(afterBot.playerPosition).toEqual(before.playerPosition)
  expect(afterBot.bots.find((bot) => bot.id === 'luna')).toMatchObject({
    state: 'idle',
    action: 'idle',
  })
  expect(afterBot.chatTexts).toContain('LunaBlocks moved here')

  await dragNpc(page, page.getByRole('button', { name: 'Select Drag Buddy' }))
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window
            .__blockBuddiesE2E!.getGameplaySnapshot()
            .savedFriends.find((friend) => friend.name === 'Drag Buddy')
            ?.position,
      ),
    )
    .not.toEqual(friendBefore.position)

  const afterFriend = await page.evaluate(() =>
    window.__blockBuddiesE2E!.getGameplaySnapshot(),
  )
  expect(afterFriend.playerPosition).toEqual(before.playerPosition)
  expect(
    afterFriend.savedFriends.find((friend) => friend.name === 'Drag Buddy')
      ?.movement,
  ).toBeUndefined()
  expect(
    afterFriend.savedFriends.find((friend) => friend.name === 'Drag Buddy')
      ?.avatar,
  ).toEqual(friendBefore.avatar)
  expect(afterFriend.chatTexts).toContain('Drag Buddy moved here')
})
