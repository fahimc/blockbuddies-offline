import { beforeEach, describe, expect, it } from 'vitest'
import { useEquipmentStore } from './equipmentStore'

describe('equipmentStore', () => {
  beforeEach(() => {
    useEquipmentStore.getState().resetEquipment()
  })

  it('equips a light saber and toggles its blade', () => {
    useEquipmentStore.getState().equipSaber('weapon-light-saber-purple')
    useEquipmentStore.getState().toggleSaber()

    expect(useEquipmentStore.getState().selectedSaber).toBe(
      'weapon-light-saber-purple',
    )
    expect(useEquipmentStore.getState().saberActive).toBe(true)
  })

  it('can explicitly turn a blade off', () => {
    useEquipmentStore.getState().setSaberActive(true)
    useEquipmentStore.getState().setSaberActive(false)
    expect(useEquipmentStore.getState().saberActive).toBe(false)
  })
})
