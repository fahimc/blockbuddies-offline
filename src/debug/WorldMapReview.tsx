import { Download, Grid3X3, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { realScale, worldScale } from '../game/scale'
import {
  createWorldTileMap,
  type WorldTile,
  type WorldTileMap,
  type WorldTileObjectKind,
  type WorldTileTerrain,
} from '../data/worldTileMap'

const terrainColors: Record<WorldTileTerrain, string> = {
  ground: '#8ddc79',
  road: '#64748b',
  sidewalk: '#d8dee7',
  park: '#39b969',
  parking: '#9aa7b8',
}

const objectColors: Record<WorldTileObjectKind, string> = {
  building: '#f97316',
  tree: '#08783d',
  lamp: '#facc15',
  'phone-box': '#dc2626',
  coin: '#fde047',
  activity: '#8b5cf6',
  landmark: '#2563eb',
  fixture: '#713f12',
  vehicle: '#ef4444',
}

const pixelPerTile = 4

export function WorldMapReview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState('LONDON-2026')
  const [viewDistance, setViewDistance] = useState<1 | 2 | 3>(3)
  const [showGrid, setShowGrid] = useState(true)
  const [showObjects, setShowObjects] = useState(true)
  const [hoveredTile, setHoveredTile] = useState<WorldTile>()
  const map = useMemo(
    () => createWorldTileMap(seed.trim() || 'LONDON-2026', viewDistance),
    [seed, viewDistance],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawWorldMap(canvas, map, showGrid, showObjects)
  }, [map, showGrid, showObjects])

  const counts = useMemo(() => {
    const terrain = Object.fromEntries(
      Object.keys(terrainColors).map((key) => [key, 0]),
    ) as Record<WorldTileTerrain, number>
    map.tiles.forEach((tile) => {
      terrain[tile.terrain] += 1
    })
    return terrain
  }, [map])

  const objectById = useMemo(
    () => new Map(map.objects.map((object) => [object.id, object])),
    [map.objects],
  )
  const hoveredObjects =
    hoveredTile?.objectIds.flatMap((id) => {
      const object = objectById.get(id)
      return object ? [object] : []
    }) ?? []

  const inspectTile = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const bounds = canvas.getBoundingClientRect()
    const column = Math.floor(
      ((event.clientX - bounds.left) / bounds.width) * map.columns,
    )
    const row = Math.floor(
      ((event.clientY - bounds.top) / bounds.height) * map.rows,
    )
    setHoveredTile(map.tiles[row * map.columns + column])
  }

  return (
    <main className="world-review-shell">
      <header className="world-review-header">
        <div>
          <p className="world-review-eyebrow">BlockBuddies developer tool</p>
          <h1>World Map Review</h1>
          <p>
            Bird's-eye view of the same terrain and placement rules used by the
            3D world.
          </p>
        </div>
        <a href="/" className="world-review-game-link">
          Open game
        </a>
      </header>

      <section className="world-review-toolbar" aria-label="Map controls">
        <label>
          <span>World seed</span>
          <input
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            maxLength={32}
          />
        </label>
        <label>
          <span>Review area</span>
          <select
            value={viewDistance}
            onChange={(event) =>
              setViewDistance(Number(event.target.value) as 1 | 2 | 3)
            }
          >
            <option value={1}>3 x 3 chunks</option>
            <option value={2}>5 x 5 chunks</option>
            <option value={3}>7 x 7 chunks</option>
          </select>
        </label>
        <button
          type="button"
          className={showGrid ? 'active' : ''}
          onClick={() => setShowGrid((value) => !value)}
        >
          <Grid3X3 size={18} aria-hidden /> Grid
        </button>
        <button
          type="button"
          className={showObjects ? 'active' : ''}
          onClick={() => setShowObjects((value) => !value)}
        >
          <RotateCcw size={18} aria-hidden /> Objects
        </button>
        <button type="button" onClick={() => downloadMap(map)}>
          <Download size={18} aria-hidden /> Export JSON
        </button>
      </section>

      <section
        className="world-review-status"
        data-testid="world-map-status"
        data-errors={map.diagnostics.length}
      >
        <strong>
          {map.diagnostics.length === 0
            ? 'Placement validation passed'
            : `${map.diagnostics.length} placement problems`}
        </strong>
        <span>
          {map.columns} x {map.rows} one-unit tiles
        </span>
        <span>{map.objects.length} placed objects</span>
        <span>
          {(realScale.roadTile / realScale.carWidth).toFixed(1)} car widths per
          road
        </span>
      </section>

      <div className="world-review-layout">
        <section className="world-review-map-panel">
          <canvas
            ref={canvasRef}
            className="world-review-map"
            width={map.columns * pixelPerTile}
            height={map.rows * pixelPerTile}
            onPointerMove={inspectTile}
            onPointerLeave={() => setHoveredTile(undefined)}
            data-testid="world-map-canvas"
            aria-label="Flat tiled map of the generated world"
          />
        </section>

        <aside className="world-review-sidebar">
          <section>
            <h2>Tile layers</h2>
            <div className="world-review-legend">
              {Object.entries(terrainColors).map(([terrain, color]) => (
                <span key={terrain}>
                  <i style={{ background: color }} />
                  {terrain} <b>{counts[terrain as WorldTileTerrain]}</b>
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2>Object layer</h2>
            <div className="world-review-legend compact">
              {Object.entries(objectColors).map(([kind, color]) => (
                <span key={kind}>
                  <i style={{ background: color }} />
                  {kind}
                </span>
              ))}
            </div>
          </section>

          <section className="world-review-inspector" aria-live="polite">
            <h2>Tile inspector</h2>
            {hoveredTile ? (
              <>
                <p>
                  <b>
                    X {hoveredTile.x}, Z {hoveredTile.z}
                  </b>
                </p>
                <p>Terrain: {hoveredTile.terrain}</p>
                <p>
                  {hoveredObjects.length > 0
                    ? hoveredObjects.map((object) => object.label).join(', ')
                    : 'No object on this tile'}
                </p>
              </>
            ) : (
              <p>Move over the map to inspect a tile.</p>
            )}
          </section>

          <section>
            <h2>Scale checks</h2>
            <dl className="world-review-scale">
              <div>
                <dt>Avatar</dt>
                <dd>{worldScale.averagePersonMeters} m</dd>
              </div>
              <div>
                <dt>Road</dt>
                <dd>
                  {(
                    realScale.roadTile /
                    (realScale.avatarHeight / worldScale.averagePersonMeters)
                  ).toFixed(1)}{' '}
                  m
                </dd>
              </div>
              <div>
                <dt>Car width</dt>
                <dd>
                  {(
                    realScale.carWidth /
                    (realScale.avatarHeight / worldScale.averagePersonMeters)
                  ).toFixed(1)}{' '}
                  m
                </dd>
              </div>
              <div>
                <dt>Sidewalk</dt>
                <dd>
                  {(
                    realScale.pavementWidth /
                    (realScale.avatarHeight / worldScale.averagePersonMeters)
                  ).toFixed(1)}{' '}
                  m
                </dd>
              </div>
            </dl>
          </section>

          {map.diagnostics.length > 0 ? (
            <section className="world-review-errors">
              <h2>Placement problems</h2>
              <ol>
                {map.diagnostics.map((diagnostic) => (
                  <li
                    key={`${diagnostic.code}:${diagnostic.objectIds.join(':')}`}
                  >
                    {diagnostic.message} at {diagnostic.x}, {diagnostic.z}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  )
}

function drawWorldMap(
  canvas: HTMLCanvasElement,
  map: WorldTileMap,
  showGrid: boolean,
  showObjects: boolean,
) {
  const context = canvas.getContext('2d')
  if (!context) return
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, canvas.width, canvas.height)
  const objectById = new Map(map.objects.map((object) => [object.id, object]))

  map.tiles.forEach((tile, index) => {
    const column = index % map.columns
    const row = Math.floor(index / map.columns)
    context.fillStyle = terrainColors[tile.terrain]
    context.fillRect(
      column * pixelPerTile,
      row * pixelPerTile,
      pixelPerTile,
      pixelPerTile,
    )
    if (!showObjects || tile.objectIds.length === 0) return
    const object = objectById.get(tile.objectIds[tile.objectIds.length - 1])
    if (!object) return
    context.fillStyle = objectColors[object.kind]
    const inset = object.kind === 'coin' || object.kind === 'lamp' ? 1 : 0
    context.fillRect(
      column * pixelPerTile + inset,
      row * pixelPerTile + inset,
      pixelPerTile - inset * 2,
      pixelPerTile - inset * 2,
    )
  })

  if (showGrid) {
    context.strokeStyle = 'rgba(15, 23, 42, 0.16)'
    context.lineWidth = 1
    const chunkPixels = 36 * pixelPerTile
    for (let x = 0; x <= canvas.width; x += chunkPixels) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
      context.stroke()
    }
    for (let y = 0; y <= canvas.height; y += chunkPixels) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
      context.stroke()
    }
  }

  context.strokeStyle = '#dc2626'
  context.lineWidth = 2
  for (const diagnostic of map.diagnostics) {
    const column = diagnostic.x - map.bounds.minX
    const row = diagnostic.z - map.bounds.minZ
    context.strokeRect(
      column * pixelPerTile,
      row * pixelPerTile,
      pixelPerTile,
      pixelPerTile,
    )
  }
}

function downloadMap(map: WorldTileMap) {
  const blob = new Blob([JSON.stringify(map, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `blockbuddies-world-${map.seed}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
