import { describe, expect, it, vi } from 'vitest'
import { copyPartyCode, sharePartyCode } from './partyCodeActions'

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
      text: 'HOST-CODE',
    })
  })

  it('falls back to clipboard copy when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(sharePartyCode('HOST-CODE', 'Host invite code', { clipboard: { writeText } })).resolves.toBe('copied')

    expect(writeText).toHaveBeenCalledWith('HOST-CODE')
  })

  it('reports unavailable when there is no code or browser support', async () => {
    await expect(copyPartyCode('', undefined)).resolves.toBe('unavailable')
    await expect(sharePartyCode('HOST-CODE', 'Host invite code', undefined)).resolves.toBe('unavailable')
  })
})
