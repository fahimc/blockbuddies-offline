type ClipboardLike = {
  writeText: (value: string) => Promise<void>
}

type ShareNavigatorLike = {
  clipboard?: ClipboardLike
  share?: (data: ShareData) => Promise<void>
}

export type PartyCodeActionResult = 'copied' | 'shared' | 'dismissed' | 'unavailable'

export async function copyPartyCode(value: string, clipboard: ClipboardLike | undefined = globalThis.navigator?.clipboard) {
  const code = value.trim()
  if (!code || !clipboard?.writeText) return 'unavailable'
  await clipboard.writeText(code)
  return 'copied' satisfies PartyCodeActionResult
}

export async function sharePartyCode(
  value: string,
  label = 'BlockBuddies local party code',
  navigatorLike: ShareNavigatorLike | undefined = globalThis.navigator,
) {
  const code = value.trim()
  if (!code) return 'unavailable' satisfies PartyCodeActionResult

  if (navigatorLike?.share) {
    try {
      await navigatorLike.share({
        title: label,
        text: code,
      })
      return 'shared' satisfies PartyCodeActionResult
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed' satisfies PartyCodeActionResult
      throw error
    }
  }

  return copyPartyCode(code, navigatorLike?.clipboard)
}
