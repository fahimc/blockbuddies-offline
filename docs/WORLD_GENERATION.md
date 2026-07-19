# World Generation Plan

BlockBuddies uses a deterministic, layered town plan. The existing seeded chunk engine remains responsible for deciding which nearby chunks are generated and rendered. The town planner decides what each cell means before any object is placed.

## Design Basis

- Roblox terrain uses a regular cell grid and streams nearby world content to reduce memory and rendering cost. BlockBuddies follows the same broad ideas with 1-unit placement cells and 36-unit streamed chunks.
- Unreal Engine's PCG framework passes spatial points through filters before spawning content. BlockBuddies applies terrain, zoning, occupancy, and clearance filters in that order.
- The map is an original BlockBuddies layout. It does not copy another game's map, branding, or assets.

References:

- [Roblox environmental terrain](https://create.roblox.com/docs/parts/terrain)
- [Roblox instance streaming](https://create.roblox.com/docs/workspace/streaming)
- [Unreal Engine PCG framework](https://dev.epicgames.com/documentation/unreal-engine/procedural-content-generation-framework-in-unreal-engine)

## Spatial Units

| Layer                  |                  Unit | Purpose                                                                  |
| ---------------------- | --------------------: | ------------------------------------------------------------------------ |
| Occupancy cell         |          1 world unit | Exclusive placement and overlap checks                                   |
| Streaming chunk        |        36 world units | Nearby generation and rendering                                          |
| Streaming sector       |       216 world units | Stable group of 6 x 6 chunks for future persistence and server ownership |
| Horizontal road repeat |        72 world units | Predictable east-west routes through every district                      |
| Vertical road repeat   |       108 world units | Wider north-south superblocks with larger buildable parcels              |
| Road width             | 7.2 real-world metres | Two-way traffic and vehicle clearance                                    |
| Sidewalk width         | 2.4 real-world metres | Clear pedestrian route plus furniture edge                               |

## Generation Order

1. **Ground tiles** create one flat, low-cost base per chunk.
2. **Road tiles** create the repeating connected street network from shared
   horizontal, vertical, and central-avenue coordinates.
3. **Sidewalk tiles** run along both sides of every road.
4. **Parcels** are cut only from cells outside the road, sidewalk, and setback corridor.
5. **Zoning** marks parcels as residential, commercial, park, or player-buildable.
6. **Buildings** occupy road-served parcels and rotate their doors toward the nearest road.
7. **Entrance clearances** reserve a pedestrian-safe area outside every door.
8. **Park scenery** places trees only inside park parcels.
9. **Street furniture** places lamps and phone boxes only in the outer sidewalk furniture strip and away from intersections.
10. **Collectibles and activities** use validated pedestrian cells and cannot occupy roads or reserved object cells.
11. **Player builds** use the same terrain and occupancy rules; procedural empty parcels remain available for custom construction.
12. **Fixed features** are looked up by every chunk their footprint intersects, then their terrain and authored objects are composed only when the owning/visible chunks are requested.

## Fixed Feature Registry

Authored destinations outside the core are not pushed into the central town to
make them fit a static map. They use deterministic world coordinates and reserve
their footprint before procedural props are accepted. Football Stadium is the
first large registered feature: its centre is `(90, -42)`, its owner is chunk
`(2, -2)`, and its access road is part of that chunk's generated surface plan.

The registry is indexed by every intersecting chunk, not only the owner chunk.
This lets wide features become visible as soon as any occupied tile enters the
active streaming window while ensuring the authored assembly is created once.

## Placement Rules

| Object           | Allowed terrain           | Additional rule                                                                |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------ |
| Building         | Ground or authored park   | Must fit a road-served parcel; door clearance remains open                     |
| Player structure | Ground                    | Outside the core town, must fit completely inside an empty buildable parcel    |
| Road             | Ground                    | Cannot cover an existing road, sidewalk, park, or reserved town object         |
| Tree             | Ground or park            | Generated trees are park-only; canopy footprint owns its full grid area        |
| Lamp             | Sidewalk                  | Generated lamps use the furniture edge, never the driving lane or intersection |
| Phone box        | Sidewalk                  | Must not block a road, door, or another prop                                   |
| Car              | Road or parking           | Requires vehicle clearance and a safe exit position                            |
| Coin             | Ground, park, or sidewalk | Must occupy a unique pedestrian cell and cannot sit inside another object      |
| Activity         | Ground or park            | Uses a reserved footprint before coins are placed                              |

## Authored Core Town

The spawn plaza, park, school, shop, houses, obby, and parking lot remain authored landmarks because they support quests and onboarding. They use the same occupancy grid for buildings, props, activities, and coins. Procedural objects are suppressed inside this authored core.

The east-west road at `z = 9` passes continuously through the core and joins
the outer north-south roads. A short central avenue links Spawn Plaza and
Clocktower Hall to that road without cutting through the northern houses. Road
surfaces are allowed through the authored core; procedural buildings and props
are not.

## Bird's-eye Review

Run `npm run dev:map` or open `/world-map.html` while the Vite server is running.
The review page renders every one-unit terrain tile and object footprint from
the same rules as the game. Red diagnostics identify forbidden terrain or
shared occupancy cells. The current map can also be exported as JSON for
offline inspection.

## Player Building

Builder Meadows is available from the town map. It intentionally contains undeveloped parcels. Build placement reports a clear reason when a piece targets a road, sidewalk, occupied landmark, developed lot, or parcel that is too small. Custom pieces continue to save through the existing local save system.

## Performance

- Generation remains seeded and deterministic, so chunks do not change when revisited.
- Only chunks around the player's current chunk are generated.
- Player velocity predicts the leading streaming window; likely chunks are prefetched during browser idle time before the player crosses the boundary.
- LRU-style limits retain at most 128 generated chunks and 12 composed world windows, preventing an infinite journey from creating infinite memory usage.
- Procedural geometry with matching shape and material is emitted through instanced meshes instead of one draw call per object.
- The full map draws nearby chunk detail only at useful zoom levels and falls back to terrain, road, feature, and chunk layers when zoomed out.
- Roads, ground, parks, and sidewalks remain simple tiled boxes or planes.
- Placement is resolved once per generated chunk instead of running random collision searches every frame.
- The plan exposes buildable parcel metadata for future editing tools without adding rendered geometry.
