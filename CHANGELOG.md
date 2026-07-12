# Changelog

## [v1.3.7-splash-overlay-polish] - 2026-07-12

### Added

- Added updated splash review screenshots for portrait and constrained Android landscape viewports.

### Changed

- Moved the splash logo lower so it clears Android top UI space.
- Reduced the splash tagline size to better match the supplied reference poster.
- Shifted the splash Play button, quick actions, and feature strip upward to leave larger bottom padding.
- Updated Android version metadata to `1.3.7` / `10307`.

### Fixed

- Fixed in-world usernames and location labels drawing over Settings, chat, and other UI overlays.

### Known Issues

- Android bars can still appear transiently after system gestures; the app continues using measured viewport height so the splash stays usable.

## [v1.3.6-portrait-splash-fix] - 2026-07-12

### Added

- Added an original generated portrait splash background based on the supplied design composition.
- Added a measured visual viewport height CSS variable for Android WebView/system UI resizing.
- Added portrait splash Playwright smoke coverage and production review screenshots.

### Changed

- Rebuilt the main menu as a single portrait-first splash poster with the BlockBuddies logo, tagline, Play button, quick actions, and offline safety strip.
- Removed the Android forced landscape orientation so the splash can open in portrait.
- Updated Android version metadata to `1.3.6` / `10306`.

### Fixed

- Fixed the splash screen not fitting when Android status/navigation/app UI reduced the available viewport.
- Fixed the old two-panel landscape splash causing the Play button to be pushed off-screen.
- Fixed Android theme settings that could allow title/action bar space to appear above the web view.

### Known Issues

- Gameplay remains best in landscape, but the splash now supports portrait, landscape, and shortened Android WebView heights.
- The generated portrait splash is an original raster asset and intentionally avoids Roblox branding or copied UI.

## [v1.3.5-immersive-character-fix] - 2026-07-12

### Added

- Added Android immersive sticky fullscreen handling for status and navigation bars.
- Added grounded procedural block avatars with animated walking legs and counter-swinging arms.
- Added updated production review screenshots for grounded phone gameplay and walking animation.

### Changed

- Updated Android version metadata to `1.3.5` / `10305`.
- Replaced static in-game GLB character rendering with runtime block avatars so movement, emotes, and ground contact are controllable.
- Bots now face their movement target while walking or running.

### Fixed

- Fixed the Android APK viewport being reduced by visible system status/navigation bars.
- Fixed player and buddy characters appearing to glide or float above the town floor.
- Fixed the player avatar face direction so the character looks forward relative to movement.

### Known Issues

- Android system bars may briefly reappear after an edge swipe; the app re-enters immersive mode when focus returns.
- The runtime avatars are procedural block characters; imported Kenney CC0 models remain licensed project assets but are not used for moving in-game avatars in this build.

## [v1.3.4-responsive-cache-fix] - 2026-07-12

### Added

- Added a landscape phone smoke test that verifies the design-sheet splash UI and compact in-game controls.
- Added updated production review screenshots for the responsive phone menu, responsive phone gameplay, and desktop gameplay.

### Changed

- Tightened short landscape splash/menu sizing so the reference-style cards fit phone-height viewports instead of clipping.
- Updated Android version metadata to `1.3.4` / `10304` for the debug APK.
- Updated PWA service worker settings to claim new builds and clean outdated caches more aggressively.

### Fixed

- Fixed Android APK startup so stale WebView service worker/cache data is cleared before Capacitor loads the web bundle.
- Fixed the phone layout shown in the latest screenshots where the old menu, always-open chat, and desktop toolbar could remain visible from cached builds.
- Fixed short landscape safe-area spacing for the top HUD, side actions, joystick, jump button, and chat drawer.

### Known Issues

- The first launch after this APK update clears WebView storage for this app version to remove stale cached UI; local save data may reset on that upgrade.
- The Three.js production bundle is still large and should be code-split before a store release.

## [v1.3.3-screen-design-refresh] - 2026-07-12

### Added

- Added a reusable chunky BlockBuddies Offline logo component with mascot and offline badge styling.
- Added redesigned splash/main menu screens with banner, feature chips, buddy lineup, town backdrop, and robot helper.
- Added updated favicon and PWA icon artwork using the new block buddy mascot direction.
- Added a branded canvas loading fallback while 3D assets load.
- Added updated review screenshots for redesigned menu and game layouts.

### Changed

- Restyled shared panels with blue headers, rounded white/blue bodies, tab strips, progress rows, item grids, profile cards, and custom toggles.
- Updated Quest Log, Shop, Avatar, Settings, and Buddy Profile screens to follow the supplied screen-design sheet more closely.
- Updated the browser title to BlockBuddies Offline.

### Fixed

- Preserved a single accessible Play button target for existing smoke tests while keeping the visual uppercase PLAY treatment.

### Known Issues

- The redesigned artwork is implemented with local CSS/SVG primitives and existing licensed assets; it does not use copied Roblox assets or external brand content.

## [v1.3.2-mobile-gamepad-ui] - 2026-07-12

### Added

- Added a compact mobile game HUD with small currency/status pills and side action buttons.
- Added a mobile chat icon with an expandable chat drawer.
- Added analog-style mobile joystick controls, a circular jump button, an interact button, and a center reset/remove control.

### Changed

- Collapsed the mobile menu into an icon-only button to match a landscape mobile game layout.
- Set the Android activity orientation to landscape for the game-like control layout.

### Fixed

- Replaced the large mobile D-pad/always-open chat panel that blocked too much of the play view.

### Known Issues

- Desktop keeps the full toolbar/chat layout; the new compact HUD is for phone/coarse-pointer and short landscape screens.

## [v1.3.1-mobile-character-fixes] - 2026-07-12

### Added

- Added a native Android WebView cache cleanup before app render to avoid launching with a previous APK's cached web bundle.
- Added a deterministic test for legacy avatar save migration.

### Changed

- Updated the default player palette away from the old yellow/blue prototype colours.
- Migrated saved legacy default avatars to the newer character palette while preserving deliberate custom avatar choices.
- Expanded the PWA precache pattern to include GLB character models.

### Fixed

- Fixed Kenney character model orientation so the avatar faces the same forward direction as player movement.
- Disabled mobile text selection, touch callouts, and drag selection across the game surface.
- Improved touch control pointer handling so long-presses do not open the Android copy/share/select menu.

### Known Issues

- Existing installed APKs may need this updated APK installed once before the native cache cleanup can remove old WebView service worker caches.
- The Three.js production bundle is still large and should be code-split before a store release.

## [v1.3.0-visual-assets] - 2026-07-12

### Added

- Added Kenney CC0 blocky character GLB models for player and buddies.
- Added Kenney CC0 prototype grid textures for the baseplate/plaza surfaces.
- Added more blocky town props: roads, spawn studs, signs, lamps, benches, windows, and a welcome billboard.
- Added asset manifest and license files for imported third-party assets.

### Changed

- Improved avatar and scene presentation toward a blocky social sandbox look while avoiding Roblox-owned branding/assets.

### Fixed

- Not applicable.

### Known Issues

- The GLB characters are static model poses with lightweight overlay emote motion rather than full animation blending.

## [v1.2.0-review-parity] - 2026-07-12

### Added

- Added feature review documentation.
- Added offline leaderboard, badges, emotes, build/place mode, and local server list.
- Added tests for leaderboard and build placement logic.
- Added smoke coverage for the new feature panels.

### Changed

- Improved mobile HUD spacing and mobile camera distance.
- Replaced mojibake touch arrows with icon buttons.

### Fixed

- Prevented build mode from placing blocks every frame while holding interact.

### Known Issues

- Full Roblox platform features remain out of scope for an offline prototype.
- Android release signing is still not configured.

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
