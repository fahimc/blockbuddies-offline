## [v1.4.8-traffic-minimap] - 2026-07-13

### Added

- Added tested traffic lane/path logic with deterministic lane creation, vehicle pose calculation, speed advance, and route wrapping.
- Added moving low-poly traffic cars that drive along the procedural borough road grid.
- Added a responsive in-game minimap showing nearby roads, location markers, buddies, traffic dots, and the player direction.
- Added Playwright smoke coverage that verifies the minimap appears in desktop and phone gameplay.
- Added a phone review screenshot for the traffic/minimap HUD.

### Changed

- Procedural park trees, street trees, and phone boxes now sample against road and pavement clearance before becoming visible collision objects.
- Updated Android version metadata to `1.4.8` / `10408`.

### Fixed

- Fixed trees spawning directly on roads and sidewalks.
- Fixed tree and phone-box colliders creating apparent invisible blockers in road lanes.

### Known Issues

- Traffic cars currently follow fixed procedural road-grid lanes and do not yet pathfind through custom build-mode roads.
- Traffic cars are visual traffic in this prototype; player collision against moving vehicles is not yet simulated.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

