import { isLightSaberId, type LightSaberId } from '../state/equipmentStore'

export const lightSaberHandSocket = {
  position: [0, -0.57, 0.04] as [number, number, number],
  rotation: [0, 0, -0.34] as [number, number, number],
}

export function lightSaberPreviewFromSearch(search: string): LightSaberId | undefined {
  const requestedSaber = new URLSearchParams(search).get('saber-preview')
  return requestedSaber && isLightSaberId(requestedSaber)
    ? requestedSaber
    : undefined
}
