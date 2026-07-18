import type { Vec3 } from './types'

export type PetPartShape = 'box' | 'sphere'

export type PetAccessoryPart = {
  id: string
  shape: PetPartShape
  position: Vec3
  scale: Vec3
  color: string
  rotation?: Vec3
  emissive?: string
  emissiveIntensity?: number
}

export type PetAccessoryModel = {
  id: 'bot' | 'puppy'
  position: Vec3
  parts: PetAccessoryPart[]
}

export function petAccessoryModel(
  accessory: string,
  accentColor = '#22d3ee',
  secondaryColor = '#f8fafc',
): PetAccessoryModel | undefined {
  if (accessory.includes('pet-bot')) {
    return {
      id: 'bot',
      position: [0.72, 0.2, 0.28],
      parts: [
        part('body', 'box', [0, 0.32, 0], [0.32, 0.34, 0.22], '#e5e7eb'),
        part('head', 'box', [0, 0.65, 0.02], [0.34, 0.28, 0.24], '#f8fafc'),
        part('screen', 'box', [0, 0.66, 0.155], [0.25, 0.15, 0.025], '#0f172a', undefined, accentColor, 0.35),
        part('eye-left', 'sphere', [-0.07, 0.68, 0.18], [0.035, 0.035, 0.02], accentColor, undefined, accentColor, 0.9),
        part('eye-right', 'sphere', [0.07, 0.68, 0.18], [0.035, 0.035, 0.02], accentColor, undefined, accentColor, 0.9),
        part('antenna', 'box', [0.1, 0.85, 0], [0.035, 0.18, 0.035], '#94a3b8', [0, 0, -0.24]),
        part('antenna-light', 'sphere', [0.14, 0.96, 0], [0.055, 0.055, 0.055], accentColor, undefined, accentColor, 0.8),
        part('arm-left', 'box', [-0.23, 0.36, 0.02], [0.08, 0.24, 0.08], '#cbd5e1', [0, 0, 0.28]),
        part('arm-right', 'box', [0.23, 0.36, 0.02], [0.08, 0.24, 0.08], '#cbd5e1', [0, 0, -0.28]),
        part('foot-left', 'box', [-0.1, 0.08, 0.03], [0.1, 0.08, 0.13], '#64748b'),
        part('foot-right', 'box', [0.1, 0.08, 0.03], [0.1, 0.08, 0.13], '#64748b'),
        part('heart', 'box', [0, 0.31, 0.13], [0.09, 0.08, 0.025], secondaryColor, undefined, secondaryColor, 0.25),
      ],
    }
  }

  if (accessory.includes('pet-puppy')) {
    return {
      id: 'puppy',
      position: [0.74, 0.17, 0.28],
      parts: [
        part('body', 'box', [0, 0.28, 0], [0.42, 0.26, 0.25], '#b86f32'),
        part('belly', 'box', [0, 0.27, 0.14], [0.26, 0.15, 0.025], '#f5d0a3'),
        part('head', 'box', [0.16, 0.52, 0.04], [0.27, 0.25, 0.23], '#c9823d'),
        part('snout', 'box', [0.17, 0.5, 0.18], [0.16, 0.09, 0.08], '#f5d0a3'),
        part('nose', 'box', [0.17, 0.54, 0.235], [0.055, 0.035, 0.025], '#111827'),
        part('ear-left', 'box', [0.04, 0.6, 0.05], [0.08, 0.18, 0.07], '#7c3f16', [0.24, 0, 0.32]),
        part('ear-right', 'box', [0.29, 0.6, 0.05], [0.08, 0.18, 0.07], '#7c3f16', [0.24, 0, -0.32]),
        part('tail', 'box', [-0.28, 0.39, -0.02], [0.08, 0.26, 0.07], '#c9823d', [0, 0, 0.8]),
        part('leg-front-left', 'box', [0.15, 0.09, 0.1], [0.08, 0.16, 0.08], '#7c3f16'),
        part('leg-front-right', 'box', [0.15, 0.09, -0.1], [0.08, 0.16, 0.08], '#7c3f16'),
        part('leg-back-left', 'box', [-0.15, 0.09, 0.1], [0.08, 0.16, 0.08], '#7c3f16'),
        part('leg-back-right', 'box', [-0.15, 0.09, -0.1], [0.08, 0.16, 0.08], '#7c3f16'),
        part('collar', 'box', [0.04, 0.42, 0.13], [0.2, 0.045, 0.035], accentColor, undefined, accentColor, 0.18),
      ],
    }
  }

  return undefined
}

function part(
  id: string,
  shape: PetPartShape,
  position: Vec3,
  scale: Vec3,
  color: string,
  rotation?: Vec3,
  emissive?: string,
  emissiveIntensity?: number,
): PetAccessoryPart {
  return {
    id,
    shape,
    position,
    scale,
    color,
    rotation,
    emissive,
    emissiveIntensity,
  }
}
