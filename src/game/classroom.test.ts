import { describe, expect, it } from 'vitest'
import {
  classroomStations,
  classroomTeacher,
  classroomTeacherDesk,
  classroomWhiteboard,
} from './classroom'

describe('classroom layout', () => {
  it('provides a teacher, readable whiteboard, and two clear rows of desks', () => {
    expect(classroomTeacher.name).toBe('Ms Maple')
    expect(classroomTeacher.position[1]).toBe(0)
    expect(classroomWhiteboard.lesson.length).toBeGreaterThan(10)
    expect(classroomWhiteboard.position[2]).toBeGreaterThan(classroomTeacherDesk.position[2])
    expect(classroomStations).toHaveLength(6)
    expect(new Set(classroomStations.map((station) => station.deskPosition[2])).size).toBe(2)
  })

  it('keeps every chair behind its desk and clear of the doorway', () => {
    classroomStations.forEach((station) => {
      expect(station.chairPosition[2]).toBeLessThan(station.deskPosition[2])
      expect(station.chairPosition[2]).toBeGreaterThan(-4)
    })
  })
})
