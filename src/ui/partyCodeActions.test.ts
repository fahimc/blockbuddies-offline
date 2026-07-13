import { describe, expect, it, vi } from 'vitest'
import { copyPartyCode, makePartyCodeShareText, pastePartyCode, sharePartyCode } from './partyCodeActions'

describe('party code actions', () => {
  it('copies trimmed party codes to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(copyPartyCode('  ABC123  ', { writeText })).resolves.toBe('copied')

    expect(writeText).toHaveBeenCalledWith('ABC123')
  })

  it('shares party codes with the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)

    await expect(sharePartyCode('HOST-CODE', 'Host invite code', { share })).resolves.toBe('shared')

    expect(share).toHaveBeenCalledWith({
      title: 'Host invite code',
      text: 'Host invite code\nHOST-CODE',
    })
  })

  it('falls back to copying when native share fails', async () => {
    const share = vi.fn().mockRejectedValue(new Error('share unavailable'))
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(sharePartyCode('HOST-CODE', 'Host invite code', { share, clipboard: { writeText } })).resolves.toBe('copied')

    expect(writeText).toHaveBeenCalledWith('HOST-CODE')
  })

  it('falls back to clipboard copy when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(sharePartyCode('HOST-CODE', 'Host invite code', { clipboard: { writeText } })).resolves.toBe('copied')

    expect(writeText).toHaveBeenCalledWith('HOST-CODE')
  })

  it('reads party codes from the clipboard for paste actions', async () => {
    await expect(pastePartyCode({ writeText: vi.fn(), readText: vi.fn().mockResolvedValue('  ANSWER-CODE  ') })).resolves.toBe('ANSWER-CODE')
  })

  it('builds readable share text around the code', () => {
    expect(makePartyCodeShareText('ABC', 'Join answer code')).toBe('Join answer code\nABC')
  })

  it('reports unavailable when there is no code or browser support', async () => {
    await expect(copyPartyCode('', undefined)).resolves.toBe('unavailable')
    await expect(sharePartyCode('HOST-CODE', 'Host invite code', undefined)).resolves.toBe('unavailable')
    await expect(pastePartyCode(undefined)).resolves.toBeUndefined()
  })
})
