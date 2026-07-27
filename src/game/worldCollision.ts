import {
  footballGoalPostCollisionBoxes,
  pointInFootballPitchClearance,
} from './football'
import { goKartTrackCollisionBoxes } from './goKart'
import { workplaceBuildings } from '../data/jobs'
import {
  buildPieceDimensions,
} from './scale'
import { outdoorBenchFixtures } from './seating'
import {
  staticLampPositions,
  staticTownBuildings,
  staticTreePositions,
} from './townPlacement'
import type { Vec3 } from './types'
import type { CollisionBox } from './collision'
import { buddyRushWorldCollisionBoxes } from './modularCollision'
import { collisionBoxOverlapsParkingClearance } from './vehicles'

export const authoredWorldCollisionBoxes: CollisionBox[] = [
  ...footballGoalPostCollisionBoxes(),
  ...goKartTrackCollisionBoxes(),
  ...staticTownBuildings.map(({ position, scale }, index) => ({
    id: `static-building:${index}`,
    center: position,
    half: [
      scale[0] / 2 + 0.18,
      scale[1] / 2,
      scale[2] / 2 + 0.18,
    ] as Vec3,
  })),
  ...workplaceBuildings.map(({ id, position, size }) => ({
    id: `workplace-building:${id}`,
    center: position,
    half: [
      size[0] / 2 + 0.18,
      size[1] / 2,
      size[2] / 2 + 0.18,
    ] as Vec3,
  })),
  ...staticTreePositions
    .filter(
      (position) =>
        !staticTreeBlocksParking(position) &&
        !staticTreeBlocksFootballPitch(position),
    )
    .map((position, index) => ({
      id: `static-tree:${index}`,
      center: [
        position[0],
        buildPieceDimensions.tree.height / 2,
        position[2],
      ] as Vec3,
      half: [
        buildPieceDimensions.tree.footprint / 2,
        buildPieceDimensions.tree.height / 2,
        buildPieceDimensions.tree.footprint / 2,
      ] as Vec3,
    })),
  ...outdoorBenchFixtures.map(({ position }, index) => ({
    id: `static-bench:${index}`,
    center: position,
    half: [1.2, 0.55, 0.45] as Vec3,
  })),
  ...staticLampPositions
    .filter(
      (position) =>
        !staticLampBlocksParking(position) &&
        !staticLampBlocksFootballPitch(position),
    )
    .map((position, index) => ({
      id: `static-lamp:${index}`,
      center: [
        position[0],
        buildPieceDimensions.lamp.height / 2,
        position[2],
      ] as Vec3,
      half: [
        buildPieceDimensions.lamp.footprint / 2,
        buildPieceDimensions.lamp.height / 2,
        buildPieceDimensions.lamp.footprint / 2,
      ] as Vec3,
    })),
  {
    id: 'static-billboard',
    center: [-11, 1.1, 2],
    half: [2, 1.3, 0.35],
  },
  ...buddyRushWorldCollisionBoxes,
]

function staticTreeBlocksParking(position: Vec3) {
  return collisionBoxOverlapsParkingClearance({
    id: 'static-tree-collision',
    center: [
      position[0],
      buildPieceDimensions.tree.height / 2,
      position[2],
    ],
    half: [
      buildPieceDimensions.tree.footprint / 2,
      buildPieceDimensions.tree.height / 2,
      buildPieceDimensions.tree.footprint / 2,
    ],
  })
}

function staticTreeBlocksFootballPitch(position: Vec3) {
  return pointInFootballPitchClearance(
    position,
    buildPieceDimensions.tree.footprint / 2 + 0.45,
  )
}

function staticLampBlocksParking(position: Vec3) {
  return collisionBoxOverlapsParkingClearance({
    id: 'static-lamp-collision',
    center: [
      position[0],
      buildPieceDimensions.lamp.height / 2,
      position[2],
    ],
    half: [
      buildPieceDimensions.lamp.footprint / 2,
      buildPieceDimensions.lamp.height / 2,
      buildPieceDimensions.lamp.footprint / 2,
    ],
  })
}

function staticLampBlocksFootballPitch(position: Vec3) {
  return pointInFootballPitchClearance(
    position,
    buildPieceDimensions.lamp.footprint / 2 + 0.35,
  )
}
