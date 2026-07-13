type ClipboardLike = {
  writeText: (value: string) => Promise<void>
  readText?: () => Promise<string>
}

type ShareNavigatorLike = {
  clipboard?: ClipboardLike
  share?: (data: ShareData) => Promise<void>
}

export type PartyCodeActionResult = 'copied' | 'shared' | 'pasted' | 'dismissed' | 'unavailable'

export async function copyPartyCode(value: string, clipboard: ClipboardLike | undefined = globalThis.navigator?.clipboard) {
  const code = value.trim()
  if (!code) return 'unavailable' satisfies PartyCodeActionResult
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(code)
      return 'copied' satisfies PartyCodeActionResult
    } catch {
      // Android WebView can expose navigator.clipboard but reject writes. Try the older copy path below.
    }
  }
  return copyPartyCodeFallback(code)
}

export async function pastePartyCode(clipboard: ClipboardLike | undefined = globalThis.navigator?.clipboard) {
  if (!clipboard?.readText) return undefined
  const text = await clipboard.readText()
  return text.trim() || undefined
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
        text: makePartyCodeShareText(code, label),
      })
      return 'shared' satisfies PartyCodeActionResult
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed' satisfies PartyCodeActionResult
      return copyPartyCode(code, navigatorLike.clipboard)
    }
  }

  return copyPartyCode(code, navigatorLike?.clipboard)
}

export function makePartyCodeShareText(code: string, label = 'BlockBuddies local party code') {
  return `${label}\n${code.trim()}`
}

function copyPartyCodeFallback(code: string) {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return 'unavailable' satisfies PartyCodeActionResult
  }
  const textarea = document.createElement('textarea')
  textarea.value = code
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  return copied ? ('copied' satisfies PartyCodeActionResult) : ('unavailable' satisfies PartyCodeActionResult)
}
