## [v1.4.9-traffic-complete] - 2026-07-13

### Added

- Added moving traffic collision boxes driven by the same lane/time math as the visible cars.
- Added player separation from moving vehicle colliders so cars cannot overlap or pass through the player.
- Added unit tests for traffic collision-box orientation and minimap heading conversion.

### Changed

- Recalculated traffic yaw for car meshes built lengthwise on local X, so cars drive forward along roads instead of sideways.
- Reworked minimap player heading to convert world yaw into screen-space map rotation.
- Synced minimap traffic dots with the same absolute-time traffic path logic used by the 3D cars.
- Updated Android version metadata to `1.4.9` / `10409`.

### Fixed

- Fixed traffic cars appearing sideways on vertical and horizontal roads.
- Fixed the minimap player arrow pointing the wrong way.
- Fixed traffic being visual-only by adding runtime player collision against moving cars.

### Known Issues

- Android production signing is still not configured; debug APKs remain the expected release artifact.

