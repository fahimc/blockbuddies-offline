## [v1.5.1-local-party-code-ux] - 2026-07-13

### Added

- Added compact compressed `BBP1` Local Party invite and answer codes with backwards compatibility for older base64 codes.
- Added Paste buttons for host invite and join answer fields, including extraction from shared text.
- Added Android WebView-friendly copy fallback for devices where `navigator.clipboard` rejects writes.
- Added native share failure fallback so Share copies the code when the device share sheet fails.
- Added same-origin answer handoff so a guest answer can appear in the host panel automatically when both sessions are in the same app origin; the host still presses Accept.

### Changed

- Replaced always-visible long generated code textareas with compact code cards, character counts, large Copy/Share buttons, and an optional Show full code section.
- Local Party join and accept fields now normalize pasted shared text into the actual party code.
- Updated Android version metadata to `1.5.1` / `10501`.

### Fixed

- Fixed join answer codes being hard to copy on mobile.
- Fixed Share failing without any useful fallback on devices that expose but reject native sharing.
- Reduced invite/answer code length compared with the previous raw base64 WebRTC signal format.

### Known Issues

- Fully automatic cross-device discovery still requires a real offline signaling transport; without one, nearby devices still use copy/share/paste codes.
- Android production signing is still not configured; debug APKs remain the expected release artifact.
