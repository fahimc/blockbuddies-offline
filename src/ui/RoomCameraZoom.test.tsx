import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultSettings, useGameStore } from '../state/gameStore'
import { RoomCameraZoom } from './RoomCameraZoom'

describe('RoomCameraZoom', () => {
  beforeEach(() => {
    useGameStore.setState({
      activeInterior: undefined,
      settings: defaultSettings,
    })
  })

  it('only appears inside rooms and updates the interior camera zoom setting', () => {
    const { rerender } = render(<RoomCameraZoom />)

    expect(screen.queryByLabelText('Room camera zoom')).not.toBeInTheDocument()

    useGameStore.setState({
      activeInterior: {
        id: 'test-room',
        title: 'Test Room',
        kind: 'school',
        returnPosition: [0, 0, 0],
        returnYaw: 0,
      },
    })
    rerender(<RoomCameraZoom />)

    const slider = screen.getByLabelText('Room camera zoom')
    expect(slider).toHaveValue('1.3')

    fireEvent.change(slider, { target: { value: '1.75' } })
    expect(useGameStore.getState().settings.interiorCameraZoom).toBe(1.75)
  })
})
