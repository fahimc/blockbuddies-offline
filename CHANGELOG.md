# Changelog

## [v1.1.0-phase-10] - 2026-07-12

### Added

- Added visual polish pass with more town props, bot actions, touch controls, and accessibility labels.
- Added final README notes, known limitations, and release artifact locations.

### Changed

- Improved mobile HUD density and panel layout.

### Fixed

- Prevented repeated frame-by-frame bot meetings from inflating relationship counts.

### Known Issues

- Production signing is not configured; debug APKs are attached to releases.

## [v1.0.0-phase-9] - 2026-07-12

### Added

- Finalised Capacitor Android project for `com.blockbuddies.offline`.
- Added local Android build instructions and GitHub Actions debug APK workflow.

### Changed

- Android WebView consumes the production PWA build from `dist`.

### Fixed

- Documented Java/JBR setup for machines where `java` is not on PATH.

### Known Issues

- Manual signing is required for a production release APK.

## [v0.9.0-phase-8] - 2026-07-12

### Added

- Added installable PWA manifest, service worker caching, offline fallback, app icon placeholder, settings menu, graphics quality, save reset, audio, music, and reduced motion options.

### Changed

- Raised Workbox precache size limit for the Three.js game bundle.

### Fixed

- Build now completes with the offline service worker enabled.

### Known Issues

- The 3D bundle is large and should be code-split in a later production pass.

## [v0.8.0-phase-7] - 2026-07-12

### Added

- Added local bot memory, friendship levels, times met, shared quest counters, last interaction tracking, and friendship panel.
- Added memory-aware bot greetings.

### Changed

- Bot dialogue can vary based on relationship state.

### Fixed

- Added cooldowns to avoid robotic repeated greetings.

### Known Issues

- Daily routines are simple schedule slots, not real calendar-day simulation.

## [v0.7.0-phase-6] - 2026-07-12

### Added

- Added coins, shop UI, unlockable items, avatar colour changes, hat placeholder, trail placeholder, and purchase tests.

### Changed

- Avatar choices are saved locally through IndexedDB/localForage.

### Fixed

- Purchase logic prevents negative coin balances.

### Known Issues

- Shop art is procedural placeholder UI.

## [v0.6.0-phase-5] - 2026-07-12

### Added

- Added beginner obby course, checkpoints, finish reward, restart/start touch control, and obby state tests.

### Changed

- Bots react when the obby is completed.

### Fixed

- Falling during an active obby resets to the latest checkpoint.

### Known Issues

- Ghost racers are represented by nearby cheering bots rather than full racing AI.

## [v0.5.0-phase-4] - 2026-07-12

### Added

- Added five starter quests, quest tracker, progress, rewards, bot reactions, and quest tests.

### Changed

- Coin rewards are issued through central quest state.

### Fixed

- Completed quests cannot be rewarded repeatedly.

### Known Issues

- Quest discovery is simple and always available from the quest panel.

## [v0.4.0-phase-3] - 2026-07-12

### Added

- Added fake multiplayer chat, speech bubbles, quick replies, join messages, contextual reactions, and dialogue tests.

### Changed

- Chat is local-only with static kid-safe dialogue.

### Fixed

- Dialogue sanitiser falls back to friendly text for banned fragments.

### Known Issues

- Free-text player chat is intentionally not implemented.

## [v0.3.0-phase-2] - 2026-07-12

### Added

- Added eight simulated buddies with profiles, moods, schedules, goals, varied timing, movement, actions, and bot state tests.

### Changed

- World now feels populated without network access.

### Fixed

- Bot state transitions are deterministic under test.

### Known Issues

- Bot avoidance is lightweight and not full crowd navigation.

## [v0.2.0-phase-1] - 2026-07-12

### Added

- Added Three.js town, ground, spawn, park, shop, school, obby, houses, player avatar, movement, jump, camera follow, touch controls, interaction zones, and HUD.

### Changed

- Replaced placeholder game screen with the playable 3D town.

### Fixed

- Player is clamped to the town and cannot fall through the ground in normal play.

### Known Issues

- Building collision is visual-only in this prototype.

## [v0.1.0-phase-0] - 2026-07-12

### Added

- Created Vite, React, TypeScript project foundation.
- Added Tailwind CSS, Three.js, React Three Fiber, Drei, Rapier, Zustand,
  localForage, PWA support, Capacitor, Vitest, Playwright, ESLint, and Prettier.
- Added Phase 0 menu and placeholder game navigation.
- Added GitHub Actions workflow for install, lint, typecheck, tests, and web build.
- Added architecture notes and phase roadmap.

### Changed

- Replaced the default Vite starter UI with the BlockBuddies Offline shell.

### Fixed

- Not applicable.

### Known Issues

- Android signing is not configured; debug APKs are the expected artifact.
