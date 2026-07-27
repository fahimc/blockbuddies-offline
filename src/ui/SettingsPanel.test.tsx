import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultSettings, useGameStore } from '../state/gameStore'
import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel Buddy Rush safety controls', () => {
  beforeEach(() => {
    useGameStore.setState({
      openPanel: 'settings',
      settings: {
        ...defaultSettings,
        buddyRushEnabled: true,
        buddyRushMode: 'standard',
      },
    })
  })

  it('allows Buddy Rush to be disabled while keeping calmer modes available', () => {
    render(<SettingsPanel />)
    const toggle = screen.getByRole('checkbox', { name: 'Buddy Rush' })
    const mode = screen.getByRole('combobox', { name: 'Buddy Rush Mode' })

    fireEvent.change(mode, { target: { value: 'reduced-tension' } })
    expect(useGameStore.getState().settings.buddyRushMode).toBe(
      'reduced-tension',
    )

    fireEvent.click(toggle)
    expect(useGameStore.getState().settings.buddyRushEnabled).toBe(false)
    expect(mode).toBeDisabled()
  })
})
