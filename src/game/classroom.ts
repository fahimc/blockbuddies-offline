import type { Vec3 } from './types'

export type ClassroomStation = {
  id: string
  deskPosition: Vec3
  chairPosition: Vec3
}

export const classroomWhiteboard = {
  position: [0, 2.12, 6.05] as Vec3,
  size: [5.4, 1.55, 0.12] as Vec3,
  lesson: 'Today: Build a kind community',
}

export const classroomTeacher = {
  name: 'Ms Maple',
  position: [3.75, 0, 4.35] as Vec3,
  yaw: Math.PI,
}

export const classroomTeacherDesk = {
  position: [0, 0.45, 4.3] as Vec3,
  size: [2.9, 0.9, 1.04] as Vec3,
}

export const classroomStations: ClassroomStation[] = [
  station('front-left', -2.4, 1.55),
  station('front-centre', 0, 1.55),
  station('front-right', 2.4, 1.55),
  station('back-left', -2.4, -1.35),
  station('back-centre', 0, -1.35),
  station('back-right', 2.4, -1.35),
]

function station(id: string, x: number, deskZ: number): ClassroomStation {
  return {
    id,
    deskPosition: [x, 0.38, deskZ],
    chairPosition: [x, 0, deskZ - 0.96],
  }
}
