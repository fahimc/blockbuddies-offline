import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NameSetupScreen } from './NameSetupScreen'

vi.mock('./GameAvatarPreview', () => ({
  GameAvatarPreview: () => <div data-testid="avatar-preview">Avatar</div>,
}))

describe('NameSetupScreen', () => {
  it('waits for the player to tap the name field before opening the keyboard', () => {
    render(<NameSetupScreen onBack={vi.fn()} onStart={vi.fn()} />)

    const nameInput = screen.getByLabelText('Character name')
    expect(nameInput).not.toHaveFocus()
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeVisible()
  })
})
