import type { Vec3 } from './types'

export const petAccessoryIds = [
  'pet-puppy',
  'pet-kitten',
  'pet-bunny',
  'pet-panda',
  'pet-fox',
  'pet-duck',
  'pet-pig',
  'pet-monkey',
  'pet-dragon',
  'pet-dino',
  'pet-unicorn',
  'pet-bot',
] as const

export type PetAccessoryId = (typeof petAccessoryIds)[number]

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
  id: PetAccessoryId
  position: Vec3
  parts: PetAccessoryPart[]
}

export function isPetAccessoryId(value: string): value is PetAccessoryId {
  return petAccessoryIds.includes(value as PetAccessoryId)
}

export function petAccessoryId(accessory: string): PetAccessoryId | undefined {
  return petAccessoryIds.find(
    (id) => accessory === id || accessory.includes(id),
  )
}

export function petAccessoryModel(
  accessory: string,
  accentColor = '#22d3ee',
  secondaryColor = '#f8fafc',
): PetAccessoryModel | undefined {
  const id = petAccessoryId(accessory)

  switch (id) {
    case 'pet-puppy':
      return puppyModel(accentColor)
    case 'pet-kitten':
      return kittenModel()
    case 'pet-bunny':
      return bunnyModel()
    case 'pet-panda':
      return pandaModel()
    case 'pet-fox':
      return foxModel()
    case 'pet-duck':
      return duckModel()
    case 'pet-pig':
      return pigModel()
    case 'pet-monkey':
      return monkeyModel()
    case 'pet-dragon':
      return dragonModel()
    case 'pet-dino':
      return dinoModel()
    case 'pet-unicorn':
      return unicornModel()
    case 'pet-bot':
      return botModel(accentColor, secondaryColor)
    default:
      return undefined
  }
}

function puppyModel(accentColor: string): PetAccessoryModel {
  return {
    id: 'pet-puppy',
    position: [0.74, 0.17, 0.28],
    parts: [
      part('body', 'box', [0, 0.28, 0], [0.42, 0.26, 0.25], '#c9823d'),
      part('belly', 'box', [0, 0.27, 0.14], [0.26, 0.15, 0.025], '#f5d0a3'),
      part('head', 'box', [0.16, 0.52, 0.04], [0.27, 0.25, 0.23], '#d99a52'),
      part('snout', 'box', [0.17, 0.5, 0.18], [0.16, 0.09, 0.08], '#f5d0a3'),
      part(
        'nose',
        'box',
        [0.17, 0.54, 0.235],
        [0.055, 0.035, 0.025],
        '#111827',
      ),
      ...eyePair(0.57, 0.185, 0.065),
      part(
        'ear-left',
        'box',
        [0.04, 0.6, 0.05],
        [0.08, 0.18, 0.07],
        '#7c3f16',
        [0.24, 0, 0.32],
      ),
      part(
        'ear-right',
        'box',
        [0.29, 0.6, 0.05],
        [0.08, 0.18, 0.07],
        '#7c3f16',
        [0.24, 0, -0.32],
      ),
      part(
        'tail',
        'box',
        [-0.28, 0.39, -0.02],
        [0.08, 0.26, 0.07],
        '#d99a52',
        [0, 0, 0.8],
      ),
      ...legSet('#7c3f16'),
      part(
        'collar',
        'box',
        [0.04, 0.42, 0.13],
        [0.2, 0.045, 0.035],
        accentColor,
        undefined,
        accentColor,
        0.18,
      ),
      part('tag', 'box', [0.05, 0.36, 0.16], [0.055, 0.055, 0.025], '#facc15'),
    ],
  }
}

function kittenModel(): PetAccessoryModel {
  return {
    id: 'pet-kitten',
    position: [0.74, 0.17, 0.28],
    parts: [
      part('body', 'box', [0, 0.29, 0], [0.36, 0.25, 0.22], '#6b7280'),
      part('chest', 'box', [0.02, 0.3, 0.13], [0.18, 0.14, 0.025], '#f8fafc'),
      part('head', 'box', [0.15, 0.54, 0.04], [0.27, 0.25, 0.22], '#4b5563'),
      ...eyePair(0.57, 0.18, 0.07),
      part('snout', 'box', [0.15, 0.5, 0.18], [0.12, 0.08, 0.06], '#f8fafc'),
      part('nose', 'box', [0.15, 0.53, 0.225], [0.045, 0.035, 0.02], '#f472b6'),
      part(
        'ear-left',
        'box',
        [0.03, 0.7, 0.03],
        [0.09, 0.15, 0.07],
        '#374151',
        [0, 0, 0.45],
      ),
      part(
        'ear-right',
        'box',
        [0.28, 0.7, 0.03],
        [0.09, 0.15, 0.07],
        '#374151',
        [0, 0, -0.45],
      ),
      part(
        'ear-inner-left',
        'box',
        [0.04, 0.7, 0.08],
        [0.045, 0.09, 0.025],
        '#f472b6',
        [0, 0, 0.45],
      ),
      part(
        'ear-inner-right',
        'box',
        [0.27, 0.7, 0.08],
        [0.045, 0.09, 0.025],
        '#f472b6',
        [0, 0, -0.45],
      ),
      part(
        'tail',
        'box',
        [-0.28, 0.42, 0],
        [0.075, 0.32, 0.07],
        '#4b5563',
        [0, 0, 0.95],
      ),
      ...legSet('#f8fafc'),
      ...whiskers(),
      part('collar', 'box', [0.04, 0.41, 0.135], [0.2, 0.04, 0.03], '#8b5cf6'),
      part('tag', 'box', [0.04, 0.36, 0.16], [0.05, 0.05, 0.022], '#facc15'),
    ],
  }
}

function bunnyModel(): PetAccessoryModel {
  return {
    id: 'pet-bunny',
    position: [0.73, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.26, 0], [0.36, 0.25, 0.23], '#f8fafc'),
      part('belly', 'box', [0.02, 0.26, 0.135], [0.18, 0.13, 0.025], '#ffe4e6'),
      part('head', 'box', [0.13, 0.51, 0.04], [0.26, 0.23, 0.21], '#ffffff'),
      ...eyePair(0.54, 0.175, 0.065),
      part('nose', 'box', [0.13, 0.5, 0.22], [0.045, 0.035, 0.02], '#fb7185'),
      part(
        'ear-left',
        'box',
        [0.04, 0.76, 0.02],
        [0.08, 0.34, 0.06],
        '#ffffff',
        [0, 0, 0.08],
      ),
      part(
        'ear-right',
        'box',
        [0.22, 0.76, 0.02],
        [0.08, 0.34, 0.06],
        '#ffffff',
        [0, 0, -0.08],
      ),
      part(
        'ear-inner-left',
        'box',
        [0.04, 0.76, 0.07],
        [0.035, 0.24, 0.02],
        '#f472b6',
        [0, 0, 0.08],
      ),
      part(
        'ear-inner-right',
        'box',
        [0.22, 0.76, 0.07],
        [0.035, 0.24, 0.02],
        '#f472b6',
        [0, 0, -0.08],
      ),
      part(
        'tail',
        'sphere',
        [-0.24, 0.33, -0.02],
        [0.12, 0.12, 0.12],
        '#ffffff',
      ),
      ...legSet('#f8fafc'),
      part(
        'paw-left',
        'box',
        [0.15, 0.02, 0.1],
        [0.075, 0.025, 0.045],
        '#f9a8d4',
      ),
      part(
        'paw-right',
        'box',
        [0.15, 0.02, -0.1],
        [0.075, 0.025, 0.045],
        '#f9a8d4',
      ),
      part('collar', 'box', [0.03, 0.39, 0.13], [0.19, 0.04, 0.03], '#ec4899'),
    ],
  }
}

function pandaModel(): PetAccessoryModel {
  return {
    id: 'pet-panda',
    position: [0.74, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.29, 0], [0.36, 0.3, 0.24], '#ffffff'),
      part(
        'belly-band',
        'box',
        [0, 0.29, 0.13],
        [0.33, 0.12, 0.025],
        '#111827',
      ),
      part('head', 'box', [0.13, 0.56, 0.04], [0.29, 0.26, 0.23], '#ffffff'),
      part(
        'eye-patch-left',
        'box',
        [0.06, 0.58, 0.175],
        [0.075, 0.095, 0.022],
        '#111827',
      ),
      part(
        'eye-patch-right',
        'box',
        [0.2, 0.58, 0.175],
        [0.075, 0.095, 0.022],
        '#111827',
      ),
      ...eyePair(0.59, 0.2, 0.07, '#ffffff'),
      part('snout', 'box', [0.13, 0.51, 0.2], [0.13, 0.07, 0.055], '#f8fafc'),
      part('nose', 'box', [0.13, 0.54, 0.235], [0.05, 0.035, 0.02], '#111827'),
      part('ear-left', 'box', [0, 0.7, 0.03], [0.1, 0.1, 0.065], '#111827'),
      part('ear-right', 'box', [0.26, 0.7, 0.03], [0.1, 0.1, 0.065], '#111827'),
      ...legSet('#111827'),
      part(
        'arm-left',
        'box',
        [-0.21, 0.33, 0.02],
        [0.08, 0.2, 0.08],
        '#111827',
      ),
      part(
        'arm-right',
        'box',
        [0.21, 0.33, 0.02],
        [0.08, 0.2, 0.08],
        '#111827',
      ),
      part(
        'bamboo-stem',
        'box',
        [0.32, 0.27, 0.15],
        [0.035, 0.36, 0.035],
        '#16a34a',
        [0, 0, -0.42],
      ),
      part(
        'bamboo-leaf-top',
        'box',
        [0.39, 0.42, 0.16],
        [0.12, 0.035, 0.035],
        '#22c55e',
        [0, 0, -0.18],
      ),
      part(
        'bamboo-leaf-low',
        'box',
        [0.25, 0.28, 0.16],
        [0.12, 0.035, 0.035],
        '#22c55e',
        [0, 0, 0.18],
      ),
    ],
  }
}

function foxModel(): PetAccessoryModel {
  return {
    id: 'pet-fox',
    position: [0.75, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.29, 0], [0.42, 0.25, 0.22], '#f97316'),
      part('chest', 'box', [0.08, 0.29, 0.13], [0.18, 0.14, 0.025], '#ffffff'),
      part('head', 'box', [0.16, 0.54, 0.04], [0.28, 0.24, 0.21], '#fb923c'),
      ...eyePair(0.57, 0.18, 0.07),
      part('snout', 'box', [0.16, 0.49, 0.19], [0.16, 0.08, 0.06], '#ffffff'),
      part('nose', 'box', [0.16, 0.52, 0.23], [0.05, 0.035, 0.022], '#111827'),
      part(
        'ear-left',
        'box',
        [0.04, 0.69, 0.03],
        [0.09, 0.15, 0.07],
        '#111827',
        [0, 0, 0.45],
      ),
      part(
        'ear-right',
        'box',
        [0.29, 0.69, 0.03],
        [0.09, 0.15, 0.07],
        '#111827',
        [0, 0, -0.45],
      ),
      part(
        'tail',
        'box',
        [-0.31, 0.39, -0.02],
        [0.12, 0.36, 0.08],
        '#f97316',
        [0, 0, 0.82],
      ),
      part(
        'tail-tip',
        'box',
        [-0.42, 0.54, -0.02],
        [0.13, 0.12, 0.085],
        '#ffffff',
        [0, 0, 0.82],
      ),
      ...legSet('#111827'),
      part('bandana', 'box', [0.04, 0.4, 0.14], [0.22, 0.08, 0.03], '#16a34a'),
    ],
  }
}

function duckModel(): PetAccessoryModel {
  return {
    id: 'pet-duck',
    position: [0.72, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.26, 0], [0.4, 0.28, 0.24], '#8b5a2b'),
      part(
        'chest-ring',
        'box',
        [0.12, 0.31, 0.13],
        [0.18, 0.07, 0.025],
        '#ffffff',
      ),
      part('head', 'box', [0.16, 0.55, 0.04], [0.25, 0.24, 0.21], '#16a34a'),
      ...eyePair(0.58, 0.175, 0.06),
      part('bill', 'box', [0.18, 0.52, 0.22], [0.2, 0.07, 0.09], '#facc15'),
      part(
        'wing-left',
        'box',
        [-0.08, 0.29, 0.13],
        [0.16, 0.13, 0.035],
        '#a16207',
      ),
      part(
        'wing-right',
        'box',
        [-0.08, 0.29, -0.13],
        [0.16, 0.13, 0.035],
        '#a16207',
      ),
      part(
        'tail',
        'box',
        [-0.28, 0.31, 0],
        [0.1, 0.13, 0.1],
        '#d6a35a',
        [0, 0, 0.55],
      ),
      part(
        'foot-left',
        'box',
        [0.1, 0.04, 0.09],
        [0.13, 0.055, 0.08],
        '#f97316',
      ),
      part(
        'foot-right',
        'box',
        [0.1, 0.04, -0.09],
        [0.13, 0.055, 0.08],
        '#f97316',
      ),
      part(
        'leg-left',
        'box',
        [0.05, 0.12, 0.08],
        [0.045, 0.14, 0.045],
        '#f97316',
      ),
      part(
        'leg-right',
        'box',
        [0.05, 0.12, -0.08],
        [0.045, 0.14, 0.045],
        '#f97316',
      ),
    ],
  }
}

function pigModel(): PetAccessoryModel {
  return {
    id: 'pet-pig',
    position: [0.74, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.27, 0], [0.42, 0.27, 0.25], '#fb7185'),
      part('head', 'box', [0.16, 0.51, 0.04], [0.28, 0.24, 0.22], '#f9a8d4'),
      ...eyePair(0.54, 0.18, 0.07),
      part('snout', 'box', [0.16, 0.49, 0.2], [0.16, 0.1, 0.065], '#f472b6'),
      part(
        'nostril-left',
        'box',
        [0.12, 0.5, 0.235],
        [0.025, 0.025, 0.02],
        '#831843',
      ),
      part(
        'nostril-right',
        'box',
        [0.2, 0.5, 0.235],
        [0.025, 0.025, 0.02],
        '#831843',
      ),
      part(
        'ear-left',
        'box',
        [0.04, 0.64, 0.02],
        [0.08, 0.12, 0.065],
        '#f472b6',
        [0, 0, 0.55],
      ),
      part(
        'ear-right',
        'box',
        [0.28, 0.64, 0.02],
        [0.08, 0.12, 0.065],
        '#f472b6',
        [0, 0, -0.55],
      ),
      part(
        'tail',
        'box',
        [-0.28, 0.37, 0],
        [0.06, 0.19, 0.055],
        '#f472b6',
        [0, 0, 1.05],
      ),
      part(
        'tail-curl',
        'box',
        [-0.34, 0.44, 0],
        [0.08, 0.045, 0.045],
        '#f472b6',
        [0, 0, -0.2],
      ),
      ...legSet('#db2777'),
      part(
        'hoof-front-left',
        'box',
        [0.15, 0.01, 0.1],
        [0.08, 0.035, 0.065],
        '#be185d',
      ),
      part(
        'hoof-front-right',
        'box',
        [0.15, 0.01, -0.1],
        [0.08, 0.035, 0.065],
        '#be185d',
      ),
    ],
  }
}

function monkeyModel(): PetAccessoryModel {
  return {
    id: 'pet-monkey',
    position: [0.72, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.28, 0], [0.34, 0.29, 0.23], '#7c3f16'),
      part('belly', 'box', [0.01, 0.28, 0.13], [0.18, 0.14, 0.025], '#d6a35a'),
      part('head', 'box', [0.12, 0.56, 0.04], [0.27, 0.25, 0.22], '#7c3f16'),
      part(
        'face-patch',
        'box',
        [0.12, 0.54, 0.18],
        [0.19, 0.14, 0.025],
        '#d6a35a',
      ),
      ...eyePair(0.58, 0.2, 0.06),
      part('mouth', 'box', [0.12, 0.49, 0.225], [0.11, 0.025, 0.02], '#7c2d12'),
      part(
        'ear-left',
        'box',
        [-0.04, 0.57, 0.03],
        [0.1, 0.16, 0.07],
        '#d6a35a',
      ),
      part(
        'ear-right',
        'box',
        [0.28, 0.57, 0.03],
        [0.1, 0.16, 0.07],
        '#d6a35a',
      ),
      part(
        'arm-left',
        'box',
        [-0.21, 0.33, 0.02],
        [0.07, 0.23, 0.07],
        '#7c3f16',
        [0, 0, -0.2],
      ),
      part(
        'arm-right',
        'box',
        [0.21, 0.33, 0.02],
        [0.07, 0.23, 0.07],
        '#7c3f16',
        [0, 0, 0.2],
      ),
      ...legSet('#5c2e10'),
      part(
        'tail',
        'box',
        [-0.27, 0.46, -0.02],
        [0.06, 0.42, 0.055],
        '#7c3f16',
        [0, 0, 1.05],
      ),
      part(
        'tail-curl',
        'box',
        [-0.39, 0.63, -0.02],
        [0.13, 0.055, 0.055],
        '#7c3f16',
        [0, 0, -0.25],
      ),
    ],
  }
}

function dragonModel(): PetAccessoryModel {
  return {
    id: 'pet-dragon',
    position: [0.75, 0.15, 0.28],
    parts: [
      part('body', 'box', [0, 0.31, 0], [0.36, 0.32, 0.24], '#dc2626'),
      part('belly', 'box', [0.04, 0.3, 0.135], [0.18, 0.2, 0.025], '#fde68a'),
      part('head', 'box', [0.16, 0.61, 0.04], [0.28, 0.25, 0.22], '#ef4444'),
      ...eyePair(0.64, 0.18, 0.07),
      part('snout', 'box', [0.16, 0.56, 0.19], [0.17, 0.09, 0.06], '#ef4444'),
      part(
        'tooth-left',
        'box',
        [0.1, 0.51, 0.23],
        [0.03, 0.06, 0.02],
        '#ffffff',
      ),
      part(
        'tooth-right',
        'box',
        [0.22, 0.51, 0.23],
        [0.03, 0.06, 0.02],
        '#ffffff',
      ),
      part(
        'horn-left',
        'box',
        [0.06, 0.78, 0.02],
        [0.055, 0.17, 0.055],
        '#facc15',
        [0, 0, 0.35],
      ),
      part(
        'horn-right',
        'box',
        [0.26, 0.78, 0.02],
        [0.055, 0.17, 0.055],
        '#facc15',
        [0, 0, -0.35],
      ),
      part(
        'wing-left',
        'box',
        [-0.22, 0.38, 0.12],
        [0.13, 0.38, 0.045],
        '#f43f5e',
        [0, 0.25, 0.55],
      ),
      part(
        'wing-right',
        'box',
        [-0.22, 0.38, -0.12],
        [0.13, 0.38, 0.045],
        '#f43f5e',
        [0, -0.25, 0.55],
      ),
      part(
        'tail',
        'box',
        [-0.3, 0.36, 0],
        [0.09, 0.34, 0.075],
        '#dc2626',
        [0, 0, 0.9],
      ),
      part(
        'tail-tip',
        'box',
        [-0.42, 0.52, 0],
        [0.08, 0.12, 0.07],
        '#facc15',
        [0, 0, 0.9],
      ),
      ...legSet('#b91c1c'),
      part(
        'back-spike-1',
        'box',
        [-0.08, 0.51, 0],
        [0.06, 0.12, 0.05],
        '#facc15',
      ),
      part(
        'back-spike-2',
        'box',
        [-0.18, 0.43, 0],
        [0.05, 0.1, 0.045],
        '#facc15',
      ),
    ],
  }
}

function dinoModel(): PetAccessoryModel {
  return {
    id: 'pet-dino',
    position: [0.74, 0.15, 0.28],
    parts: [
      part('body', 'box', [0, 0.31, 0], [0.36, 0.32, 0.24], '#65a30d'),
      part('belly', 'box', [0.05, 0.29, 0.135], [0.18, 0.2, 0.025], '#fde68a'),
      part('head', 'box', [0.17, 0.62, 0.04], [0.29, 0.26, 0.22], '#84cc16'),
      ...eyePair(0.66, 0.18, 0.07),
      part('snout', 'box', [0.18, 0.56, 0.19], [0.18, 0.09, 0.06], '#84cc16'),
      part(
        'tooth-left',
        'box',
        [0.11, 0.51, 0.23],
        [0.03, 0.06, 0.02],
        '#ffffff',
      ),
      part(
        'tooth-right',
        'box',
        [0.25, 0.51, 0.23],
        [0.03, 0.06, 0.02],
        '#ffffff',
      ),
      part(
        'arm-left',
        'box',
        [0.2, 0.35, 0.12],
        [0.055, 0.16, 0.05],
        '#4d7c0f',
        [0, 0, -0.4],
      ),
      part(
        'arm-right',
        'box',
        [0.2, 0.35, -0.12],
        [0.055, 0.16, 0.05],
        '#4d7c0f',
        [0, 0, 0.4],
      ),
      ...legSet('#4d7c0f'),
      part(
        'tail',
        'box',
        [-0.31, 0.36, 0],
        [0.1, 0.34, 0.075],
        '#65a30d',
        [0, 0, 0.88],
      ),
      part(
        'tail-tip',
        'box',
        [-0.43, 0.5, 0],
        [0.08, 0.1, 0.065],
        '#84cc16',
        [0, 0, 0.88],
      ),
      part(
        'back-spike-1',
        'box',
        [-0.05, 0.52, 0],
        [0.055, 0.12, 0.05],
        '#166534',
      ),
      part(
        'back-spike-2',
        'box',
        [-0.16, 0.46, 0],
        [0.05, 0.1, 0.045],
        '#166534',
      ),
      part(
        'back-spike-3',
        'box',
        [-0.26, 0.39, 0],
        [0.045, 0.08, 0.04],
        '#166534',
      ),
    ],
  }
}

function unicornModel(): PetAccessoryModel {
  return {
    id: 'pet-unicorn',
    position: [0.74, 0.16, 0.28],
    parts: [
      part('body', 'box', [0, 0.29, 0], [0.42, 0.26, 0.24], '#ffffff'),
      part('head', 'box', [0.16, 0.56, 0.04], [0.27, 0.25, 0.22], '#f8fafc'),
      ...eyePair(0.59, 0.18, 0.07),
      part('snout', 'box', [0.17, 0.52, 0.19], [0.15, 0.08, 0.06], '#fbcfe8'),
      part('nose', 'box', [0.17, 0.55, 0.23], [0.045, 0.03, 0.02], '#a855f7'),
      part(
        'ear-left',
        'box',
        [0.05, 0.7, 0.03],
        [0.075, 0.13, 0.06],
        '#ffffff',
        [0, 0, 0.42],
      ),
      part(
        'ear-right',
        'box',
        [0.27, 0.7, 0.03],
        [0.075, 0.13, 0.06],
        '#ffffff',
        [0, 0, -0.42],
      ),
      part(
        'horn',
        'box',
        [0.16, 0.8, 0.06],
        [0.06, 0.21, 0.06],
        '#facc15',
        [0, 0, 0.08],
      ),
      part(
        'mane-purple',
        'box',
        [0.04, 0.59, -0.08],
        [0.055, 0.18, 0.055],
        '#a855f7',
      ),
      part(
        'mane-cyan',
        'box',
        [0.01, 0.48, -0.08],
        [0.055, 0.16, 0.055],
        '#22d3ee',
      ),
      part(
        'mane-pink',
        'box',
        [-0.03, 0.37, -0.08],
        [0.055, 0.14, 0.055],
        '#fb7185',
      ),
      part(
        'tail-purple',
        'box',
        [-0.29, 0.41, 0],
        [0.08, 0.26, 0.065],
        '#a855f7',
        [0, 0, 0.8],
      ),
      part(
        'tail-cyan',
        'box',
        [-0.34, 0.48, 0.04],
        [0.055, 0.22, 0.05],
        '#22d3ee',
        [0, 0, 0.8],
      ),
      ...legSet('#f8fafc'),
      part(
        'hoof-front-left',
        'box',
        [0.15, 0.01, 0.1],
        [0.08, 0.035, 0.065],
        '#7c3aed',
      ),
      part(
        'hoof-front-right',
        'box',
        [0.15, 0.01, -0.1],
        [0.08, 0.035, 0.065],
        '#7c3aed',
      ),
      part(
        'collar-star',
        'box',
        [0.04, 0.4, 0.14],
        [0.08, 0.08, 0.025],
        '#facc15',
        undefined,
        '#facc15',
        0.18,
      ),
    ],
  }
}

function botModel(
  accentColor: string,
  secondaryColor: string,
): PetAccessoryModel {
  return {
    id: 'pet-bot',
    position: [0.72, 0.2, 0.28],
    parts: [
      part('body', 'box', [0, 0.32, 0], [0.32, 0.34, 0.22], '#e5e7eb'),
      part('head', 'box', [0, 0.65, 0.02], [0.34, 0.28, 0.24], '#f8fafc'),
      part(
        'screen',
        'box',
        [0, 0.66, 0.155],
        [0.25, 0.15, 0.025],
        '#0f172a',
        undefined,
        accentColor,
        0.35,
      ),
      part(
        'eye-left',
        'sphere',
        [-0.07, 0.68, 0.18],
        [0.035, 0.035, 0.02],
        accentColor,
        undefined,
        accentColor,
        0.9,
      ),
      part(
        'eye-right',
        'sphere',
        [0.07, 0.68, 0.18],
        [0.035, 0.035, 0.02],
        accentColor,
        undefined,
        accentColor,
        0.9,
      ),
      part(
        'antenna',
        'box',
        [0.1, 0.85, 0],
        [0.035, 0.18, 0.035],
        '#94a3b8',
        [0, 0, -0.24],
      ),
      part(
        'antenna-light',
        'sphere',
        [0.14, 0.96, 0],
        [0.055, 0.055, 0.055],
        accentColor,
        undefined,
        accentColor,
        0.8,
      ),
      part(
        'arm-left',
        'box',
        [-0.23, 0.36, 0.02],
        [0.08, 0.24, 0.08],
        '#cbd5e1',
        [0, 0, 0.28],
      ),
      part(
        'arm-right',
        'box',
        [0.23, 0.36, 0.02],
        [0.08, 0.24, 0.08],
        '#cbd5e1',
        [0, 0, -0.28],
      ),
      part(
        'foot-left',
        'box',
        [-0.1, 0.08, 0.03],
        [0.1, 0.08, 0.13],
        '#64748b',
      ),
      part(
        'foot-right',
        'box',
        [0.1, 0.08, 0.03],
        [0.1, 0.08, 0.13],
        '#64748b',
      ),
      part(
        'heart',
        'box',
        [0, 0.31, 0.13],
        [0.09, 0.08, 0.025],
        secondaryColor,
        undefined,
        secondaryColor,
        0.25,
      ),
    ],
  }
}

function eyePair(
  y: number,
  z: number,
  x = 0.07,
  color = '#111827',
): PetAccessoryPart[] {
  return [
    part('eye-left', 'box', [-x, y, z], [0.04, 0.06, 0.02], color),
    part('eye-right', 'box', [x, y, z], [0.04, 0.06, 0.02], color),
  ]
}

function legSet(color: string): PetAccessoryPart[] {
  return [
    part('leg-front-left', 'box', [0.15, 0.09, 0.1], [0.08, 0.16, 0.08], color),
    part(
      'leg-front-right',
      'box',
      [0.15, 0.09, -0.1],
      [0.08, 0.16, 0.08],
      color,
    ),
    part('leg-back-left', 'box', [-0.15, 0.09, 0.1], [0.08, 0.16, 0.08], color),
    part(
      'leg-back-right',
      'box',
      [-0.15, 0.09, -0.1],
      [0.08, 0.16, 0.08],
      color,
    ),
  ]
}

function whiskers(): PetAccessoryPart[] {
  return [
    part(
      'whisker-left-top',
      'box',
      [0.04, 0.54, 0.235],
      [0.11, 0.015, 0.015],
      '#111827',
      [0, 0, 0.12],
    ),
    part(
      'whisker-left-low',
      'box',
      [0.04, 0.49, 0.235],
      [0.11, 0.015, 0.015],
      '#111827',
      [0, 0, -0.12],
    ),
    part(
      'whisker-right-top',
      'box',
      [0.26, 0.54, 0.235],
      [0.11, 0.015, 0.015],
      '#111827',
      [0, 0, -0.12],
    ),
    part(
      'whisker-right-low',
      'box',
      [0.26, 0.49, 0.235],
      [0.11, 0.015, 0.015],
      '#111827',
      [0, 0, 0.12],
    ),
  ]
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
