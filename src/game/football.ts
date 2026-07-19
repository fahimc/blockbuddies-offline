import type { Vec3 } from './types'

export type FootballBallRuntime = {
  id: string
  label: string
  position: Vec3
  velocity: Vec3
  skillUntil?: number
  skillAnchor?: Vec3
  lastGoalAt?: number
}

export type FootballGoalId = 'north-goal' | 'south-goal'

export type FootballGoal = {
  id: FootballGoalId
  label: string
  center: Vec3
  yaw: number
}

export type FootballBallPatch = {
  position: Vec3
  rotation: Vec3
  radius: number
}

export const footballPitch = {
  center: [36, 0, -43] as Vec3,
  width: 11,
  length: 20,
  borderClearance: 3.5,
  goalWidth: 5,
  goalDepth: 1.2,
}

export const footballBallRadius = 0.36
export const footballBallInteractionRadius = 2.1
export const footballGoalReward = 12
export const footballSkillDurationMs = 1600

export const footballBallPatchFaces: FootballBallPatch[] = [
  {
    position: [0, footballBallRadius * 1.018, 0],
    rotation: [-Math.PI / 2, 0, 0],
    radius: footballBallRadius * 0.23,
  },
  {
    position: [footballBallRadius * 1.018, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    radius: footballBallRadius * 0.2,
  },
  {
    position: [-footballBallRadius * 1.018, 0, 0],
    rotation: [0, -Math.PI / 2, 0],
    radius: footballBallRadius * 0.2,
  },
  {
    position: [0, 0, footballBallRadius * 1.018],
    rotation: [0, 0, 0],
    radius: footballBallRadius * 0.2,
  },
  {
    position: [0, 0, -footballBallRadius * 1.018],
    rotation: [0, Math.PI, 0],
    radius: footballBallRadius * 0.2,
  },
]

export const footballGoals: FootballGoal[] = [
  {
    id: 'north-goal',
    label: 'North Goal',
    center: [
      footballPitch.center[0],
      0,
      footballPitch.center[2] - footballPitch.length / 2,
    ],
    yaw: 0,
  },
  {
    id: 'south-goal',
    label: 'South Goal',
    center: [
      footballPitch.center[0],
      0,
      footballPitch.center[2] + footballPitch.length / 2,
    ],
    yaw: Math.PI,
  },
]

export function createFootballBalls(): FootballBallRuntime[] {
  return [
    {
      id: 'football-main',
      label: 'Match Ball',
      position: [
        footballPitch.center[0],
        footballBallRadius,
        footballPitch.center[2],
      ],
      velocity: [0, 0, 0],
    },
    {
      id: 'football-practice',
      label: 'Practice Ball',
      position: [
        footballPitch.center[0] - 3.1,
        footballBallRadius,
        footballPitch.center[2] + 1.6,
      ],
      velocity: [0, 0, 0],
    },
  ]
}

export function nearestFootballBall(
  playerPosition: Vec3,
  balls: FootballBallRuntime[],
  radius = footballBallInteractionRadius,
) {
  let nearest: FootballBallRuntime | undefined
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const ball of balls) {
    const distance = Math.hypot(
      ball.position[0] - playerPosition[0],
      ball.position[2] - playerPosition[2],
    )
    if (distance > radius || distance >= nearestDistance) continue
    nearest = ball
    nearestDistance = distance
  }
  return nearest
}

export function footballKickVelocity(yaw: number, power: number): Vec3 {
  const normalizedPower = clamp(power, 0, 1)
  const speed = 8 + normalizedPower * 18
  return [Math.sin(yaw) * speed, 0, Math.cos(yaw) * speed]
}

export function beginFootballSkill(
  ball: FootballBallRuntime,
  playerPosition: Vec3,
  now: number,
): FootballBallRuntime {
  return {
    ...ball,
    position: [
      playerPosition[0],
      footballBallRadius + 0.72,
      playerPosition[2] - 0.55,
    ],
    velocity: [0, 0, 0],
    skillUntil: now + footballSkillDurationMs,
    skillAnchor: [playerPosition[0], 0, playerPosition[2]],
  }
}

export function advanceFootballBall(
  ball: FootballBallRuntime,
  deltaSeconds: number,
  now: number,
): FootballBallRuntime {
  if (ball.skillUntil && ball.skillAnchor && now < ball.skillUntil) {
    const elapsed = (footballSkillDurationMs - (ball.skillUntil - now)) / 1000
    const bounce = Math.abs(Math.sin(elapsed * Math.PI * 4.5))
    return {
      ...ball,
      position: [
        ball.skillAnchor[0] + Math.sin(elapsed * 4.2) * 0.28,
        footballBallRadius + 0.45 + bounce * 1.05,
        ball.skillAnchor[2] - 0.62,
      ],
      velocity: [0, 0, 0],
    }
  }

  const next: FootballBallRuntime = {
    ...ball,
    skillUntil: undefined,
    skillAnchor: undefined,
    position: [
      ball.position[0] + ball.velocity[0] * deltaSeconds,
      footballBallRadius,
      ball.position[2] + ball.velocity[2] * deltaSeconds,
    ],
    velocity: [...ball.velocity],
  }

  const friction = Math.max(0, 1 - deltaSeconds * 1.95)
  next.velocity = [next.velocity[0] * friction, 0, next.velocity[2] * friction]
  if (Math.hypot(next.velocity[0], next.velocity[2]) < 0.08)
    next.velocity = [0, 0, 0]

  const halfWidth = footballPitch.width / 2 - footballBallRadius
  const halfLength = footballPitch.length / 2 + footballPitch.goalDepth
  const minX = footballPitch.center[0] - halfWidth
  const maxX = footballPitch.center[0] + halfWidth
  const minZ = footballPitch.center[2] - halfLength
  const maxZ = footballPitch.center[2] + halfLength

  if (next.position[0] < minX || next.position[0] > maxX) {
    next.position[0] = clamp(next.position[0], minX, maxX)
    next.velocity[0] *= -0.45
  }
  if (next.position[2] < minZ || next.position[2] > maxZ) {
    next.position[2] = clamp(next.position[2], minZ, maxZ)
    next.velocity[2] *= -0.45
  }

  return next
}

export function footballGoalForBall(ball: FootballBallRuntime) {
  const halfGoal = footballPitch.goalWidth / 2
  if (Math.abs(ball.position[0] - footballPitch.center[0]) > halfGoal) {
    return undefined
  }
  const northLine = footballPitch.center[2] - footballPitch.length / 2
  const southLine = footballPitch.center[2] + footballPitch.length / 2
  if (ball.position[2] <= northLine - 0.1) return footballGoals[0]
  if (ball.position[2] >= southLine + 0.1) return footballGoals[1]
  return undefined
}

export function resetFootballBall(
  ball: FootballBallRuntime,
  offsetIndex = 0,
): FootballBallRuntime {
  const resetX = footballPitch.center[0] + (offsetIndex % 2 === 0 ? 0 : -3.1)
  const resetZ = footballPitch.center[2] + (offsetIndex % 2 === 0 ? 0 : 1.6)
  return {
    ...ball,
    position: [resetX, footballBallRadius, resetZ],
    velocity: [0, 0, 0],
    skillUntil: undefined,
    skillAnchor: undefined,
  }
}

export function pointInFootballPitchClearance(position: Vec3, padding = 0) {
  return footprintIntersectsFootballPitch(position, [0, 0, 0], padding)
}

export function footprintIntersectsFootballPitch(
  center: Vec3,
  size: Vec3,
  padding = 0,
) {
  const halfWidth =
    footballPitch.width / 2 +
    footballPitch.borderClearance +
    padding +
    size[0] / 2
  const halfLength =
    footballPitch.length / 2 +
    footballPitch.borderClearance +
    padding +
    size[2] / 2
  return (
    Math.abs(center[0] - footballPitch.center[0]) <= halfWidth &&
    Math.abs(center[2] - footballPitch.center[2]) <= halfLength
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
