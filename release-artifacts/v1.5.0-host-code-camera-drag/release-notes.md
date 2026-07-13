## [v1.5.0-host-code-camera-drag] - 2026-07-13

### Added

- Added Copy and Share buttons beside host invite codes and guest answer codes in Local Party.
- Added Web Share support for party codes with a clipboard fallback when native sharing is unavailable.
- Added drag-to-look screen control so players can rotate and tilt the third-person camera by dragging the world view.
- Added unit tests for party-code copy/share helpers and camera drag math.

### Changed

- Local Party code boxes now use mobile-friendly action buttons instead of relying on selecting long code text.
- Mobile gameplay now supports joystick movement and independent camera drag at the same time.
- Updated Android version metadata to `1.5.0` / `10500`.

### Fixed

- Fixed host invite codes being difficult to copy on mobile.
- Fixed the missing touch-screen view control that made it hard to look around like other mobile sandbox games.

### Known Issues

- Android production signing is still not configured; debug APKs remain the expected release artifact.
