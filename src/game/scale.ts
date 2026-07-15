import type { Vec3 } from './types'

const roundUnit = (value: number) => Math.round(value * 100) / 100

export const worldScale = {
  averagePersonMeters: 1.78,
  avatarHeightUnits: 2.64,
}

export const unitsPerMeter = worldScale.avatarHeightUnits / worldScale.averagePersonMeters

export const avatarGeometry = {
  bodyBaseY: -0.9,
  legJointY: 0.64,
  sneakerCenterY: -0.68,
  sneakerHeight: 0.12,
  bootHeight: 0.2,
  tallestHairCenterY: 2.45,
  tallestHairHeight: 0.34,
}

export const avatarBodyBaseY = avatarGeometry.bodyBaseY
export const avatarSitDrop = 0.35
export const avatarSeatRootLift = roundUnit(
  avatarSitDrop - avatarGeometry.bodyBaseY - avatarGeometry.legJointY,
)
export const avatarSneakerFootBottomY = roundUnit(
  avatarGeometry.bodyBaseY + avatarGeometry.legJointY + avatarGeometry.sneakerCenterY - avatarGeometry.sneakerHeight / 2,
)
export const avatarBootFootBottomY = roundUnit(
  avatarGeometry.bodyBaseY + avatarGeometry.legJointY + avatarGeometry.sneakerCenterY - avatarGeometry.bootHeight / 2,
)
export const avatarGroundOffset = roundUnit(-avatarSneakerFootBottomY)
export const avatarVisualTopY = roundUnit(avatarGeometry.bodyBaseY + avatarGeometry.tallestHairCenterY + avatarGeometry.tallestHairHeight / 2)
export const avatarVisualHeight = roundUnit(avatarVisualTopY - avatarSneakerFootBottomY)

export function meters(value: number) {
  return roundUnit(value * unitsPerMeter)
}

export const realScale = {
  avatarHeight: worldScale.avatarHeightUnits,
  doorHeight: meters(2.05),
  doorWidth: meters(0.9),
  doorDepth: meters(0.08),
  floorHeight: meters(3.2),
  roofHeight: meters(0.85),
  windowWidth: meters(0.75),
  windowHeight: meters(1),
  windowDepth: meters(0.06),
  carLength: meters(4.35),
  carWidth: meters(1.82),
  carHeight: meters(1.45),
  carBodyHeight: meters(0.72),
  carCabinHeight: meters(0.62),
  wheelRadius: meters(0.32),
  busLength: meters(8.8),
  busWidth: meters(2.55),
  busHeight: meters(3.2),
  phoneBoxHeight: meters(2.35),
  phoneBoxWidth: meters(0.9),
  lampHeight: meters(3.6),
  treeTrunkHeight: meters(2.4),
  treeCanopySize: meters(2.4),
  roadTile: meters(7.2),
  pavementWidth: meters(2.4),
}

export function buildingHeightForFloors(floors: number) {
  return roundUnit(realScale.floorHeight * floors)
}

export function buildingScale(floors: number, widthMeters: number, depthMeters: number): Vec3 {
  return [meters(widthMeters), buildingHeightForFloors(floors), meters(depthMeters)]
}

export function buildingCenterPosition(x: number, z: number, floors: number): Vec3 {
  return [x, buildingHeightForFloors(floors) / 2, z]
}

export function floorCountFromHeight(height: number) {
  return Math.max(1, Math.round(height / realScale.floorHeight))
}

export const buildPieceDimensions = {
  house: {
    floors: 2,
    width: meters(4.2),
    depth: meters(4.1),
    bodyHeight: buildingHeightForFloors(2),
    roofHeight: realScale.roofHeight,
  },
  building: {
    floors: 4,
    width: meters(4.8),
    depth: meters(4.8),
    bodyHeight: buildingHeightForFloors(4),
    roofHeight: meters(0.45),
  },
  shop: {
    floors: 1,
    width: meters(5.4),
    depth: meters(4.6),
    bodyHeight: buildingHeightForFloors(1),
    awningHeight: meters(0.35),
  },
  car: {
    length: realScale.carLength,
    width: realScale.carWidth,
    height: realScale.carHeight,
  },
  tree: {
    footprint: realScale.treeCanopySize,
    height: realScale.treeTrunkHeight + realScale.treeCanopySize,
  },
  lamp: {
    footprint: meters(0.7),
    height: realScale.lampHeight,
  },
}
