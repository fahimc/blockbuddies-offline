import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../state/gameStore'
import { AvatarPanel } from './AvatarPanel'

vi.mock('./GameAvatarPreview', () => ({
  GameAvatarPreview: ({ yaw }: { yaw?: number }) => <div data-testid="real-avatar-preview" data-yaw={yaw} />,
}))

describe('AvatarPanel character preview', () => {
  beforeEach(() => {
    useGameStore.setState({ coins: 0, openPanel: undefined })
  })

  it('uses direct drag rotation without a turntable or rotate button', () => {
    render(<AvatarPanel />)

    const preview = screen.getByRole('img', { name: /drag left or right to turn/i })
    expect(screen.queryByRole('button', { name: /rotate avatar/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('real-avatar-preview')).toHaveAttribute('data-yaw', '-0.2')

    fireEvent.pointerDown(preview, { pointerId: 7, pointerType: 'touch', clientX: 100 })
    fireEvent.pointerMove(preview, { pointerId: 7, pointerType: 'touch', clientX: 150 })
    fireEvent.pointerUp(preview, { pointerId: 7, pointerType: 'touch', clientX: 150 })

    expect(Number(screen.getByTestId('real-avatar-preview').getAttribute('data-yaw'))).toBeCloseTo(0.4)
  })
})
