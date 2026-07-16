import { describe, expect, it } from 'vitest'
import { realScale } from '../game/scale'
import { createWorldTileMap } from './worldTileMap'

describe('world tile map', () => {
  it('builds deterministic terrain and object layers without forbidden placement', () => {
    const first = createWorldTileMap('LONDON-2026', 2)
    const second = createWorldTileMap('LONDON-2026', 2)

    expect(first.tiles).toEqual(second.tiles)
    expect(first.objects).toEqual(second.objects)
    expect(first.diagnostics).toEqual([])
  })

  it('provides roads wide enough for two vehicle lanes and clearance', () => {
    expect(realScale.roadTile).toBeGreaterThan(realScale.carWidth * 3.4)
    expect(realScale.roadTile).toBeGreaterThan(realScale.busWidth * 2.5)
  })

  it('never assigns a solid object to a road tile', () => {
    const map = createWorldTileMap('LONDON-2026', 3)
    const solidKinds = new Set([
      'building',
      'tree',
      'lamp',
      'phone-box',
      'landmark',
      'fixture',
    ])
    const objectById = new Map(map.objects.map((object) => [object.id, object]))
    const offenders = map.tiles.flatMap((tile) =>
      tile.terrain === 'road'
        ? tile.objectIds.filter((id) =>
            solidKinds.has(objectById.get(id)?.kind ?? ''),
          )
        : [],
    )

    expect([...new Set(offenders)]).toEqual([])
  })
})
