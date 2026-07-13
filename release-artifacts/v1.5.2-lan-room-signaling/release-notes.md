## [v1.5.2-lan-room-signaling] - 2026-07-13

### Added

- Added an Android-only native LocalSignal Capacitor plugin that lets the host APK run a small LAN handshake server.
- Added Android Network Service Discovery advertising for BlockBuddies LAN rooms.
- Added room discovery, host room creation, room joining, and host approval flow to Local Party.
- Added native HTTP signaling endpoints for host offers and guest answers so users no longer need to exchange accept codes in Android room mode.
- Added Android network, Wi-Fi, and multicast permissions required for LAN discovery and room hosting.
- Added unit tests for LAN room helper naming/labels and smoke coverage for the room-first Local Party UI.

### Changed

- Local Party now presents Room Name, Host Room, Find Rooms, and Join Room controls first.
- Manual invite/answer codes remain available as a fallback for web/PWA or devices where LAN discovery is blocked.
- The host room stops advertising after one peer connects because the current Local Party peer store supports one live local peer.
- Updated Android version metadata to `1.5.2` / `10502`.

### Fixed

- Fixed the broken network-mode UX that required guests to manually copy an answer code back to the host.
- Fixed the missing host-side handshake server by moving LAN signaling into the Android APK.

### Known Issues

- LAN room mode requires the Android APK on devices connected to the same local network; the web/PWA cannot host a LAN socket server.
- Some routers isolate Wi-Fi clients or block multicast discovery; manual code fallback is still available for those networks.
- Android production signing is still not configured; debug APKs remain the expected release artifact.
