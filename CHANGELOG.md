# Changelog

## [Unreleased]

### Added

- Added height-aware player gravity with landable solid tops and solid undersides for world, interior, build-mode, traffic, and obby collision objects.
- Added deterministic tests for object-top landing, low-step traversal, ceiling collision, sleep orientation, wake clearance, 2x run speed, rendered traffic height, and procedural road clearance.

### Changed

- Mobile Run is now a press-and-hold control and running is exactly twice walking speed; desktop Shift remains hold-to-run.
- Obby checkpoint positions now use the rendered platform tops so players land on the course instead of intersecting its blocks.
- Build-mode and moving-traffic collision heights now match their rendered geometry, including rotated rectangular pieces.

### Fixed

- Corrected the bed pose so the avatar faces upward with their head at the pillow.
- Routed bed taps and action-button taps through the same controller transition and moved waking players beside the bed at floor height.
- Prevented players from sinking through furniture and becoming trapped inside collision objects after waking.
- Removed obsolete stationary red procedural buses that occupied live traffic lanes.

### Known Issues

- World scenery remains intentionally static rather than destructible rigid-body simulation; gameplay objects now provide deterministic gravity support and solid surfaces.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.5.8-town-map-fast-travel] - 2026-07-14

### Added

- Added a responsive full-town map with selectable landmark markers and fast travel to six key places.
- Added collision-safe arrival points, activity travel guards, and unit/E2E coverage for map travel.
- Added end-to-end browser coverage for all four mini-games and local-party multiplayer connection and state synchronization.
- Added a mobile Run toggle and Shift sprint controls with distinct walk/run speeds and animations.
- Added a contextual bed action that lets players sleep, wake, or move to get out of bed inside houses.
- Added deterministic traffic safety tests, bed interaction tests, mobile control tests, and name-screen focus coverage.

### Changed

- The minimap and hamburger menu now open the full map, including from inside buildings.
- Obby and mini-game start relocation now uses the same acknowledged controller teleport flow.
- Traffic now advances from shared live simulation offsets and yields to players, AI buddies, and local-party players in the lane ahead.
- Mobile interaction taps now remain active long enough for the game frame to consume quick taps reliably.
- Mobile customization screens now keep the live avatar visible while presenting categories and options in cleaner phone-sized layouts.
- Updated Android version metadata to `1.5.8` / `10508`.

### Fixed

- Prevented a retiring player-controller frame from overwriting a requested teleport destination.
- Reversed horizontal and vertical camera orbit drag so the world follows direct touch movement correctly.
- Prevented the name field from automatically opening the mobile keyboard when the naming screen appears.
- Kept stopped traffic visuals and collision boxes synchronized.

### Known Issues

- Traffic uses lane-based safety zones rather than full rigid-body vehicle physics.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.5.7-original-mini-games] - 2026-07-14

### Added

- Added an original Mini Games panel in the hamburger menu with Coin Rush, Delivery Dash, Hide & Seek, and Beginner Obby entry points.
- Added start pads and in-world targets for Coin Rush, ordered Delivery Dash stops, and Hide & Seek buddies.
- Added mini-game runtime state, local records, coin rewards, chat reactions, save persistence, and the Mini Game Star badge.
- Added unit coverage for mini-game timers, ordered scoring, completion records, timeout failure, and store reward flow.
- Added Playwright smoke coverage for the Mini Games menu panel.

### Changed

- The HUD now shows active mini-game score progress while a mini-game is running.
- The mobile reset button becomes a Cancel Mini Game control while a mini-game is active.
- Updated Android version metadata to `1.5.7` / `10507`.

### Fixed

- Mini-game activity access is now centralized in the in-game menu instead of relying only on world proximity.

### Known Issues

- Mini-games are original offline activities inspired by blocky sandbox play; Roblox branding, assets, marketplace systems, global servers, and copied game modes are intentionally not included.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.5.6-grounded-avatars-preview] - 2026-07-14

### Added

- Added shared avatar geometry constants for foot-bottom, standing height, and visual height calculations.
- Added regression coverage that ties indoor standing height to the shared avatar ground offset.

### Changed

- Player, bot, remote party avatar, interior buddy, and obby reset standing heights now use the same measured avatar ground offset.
- Character customization preview now frames the real in-game 3D avatar at standing height with extra headroom.
- Updated Android version metadata to `1.5.6` / `10506`.

### Fixed

- Fixed animated avatars floating because the walk/idle animation loop overwrote the body group's base Y offset.
- Fixed outdoor and indoor characters appearing detached from floors after movement or idle animation.
- Fixed the customization preview clipping the avatar head/hair by using a wider camera fit.

### Known Issues

- Avatar gravity still clamps to the main floor plane; raised obby platforms remain prototype activity geometry rather than full platform physics.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.5.5-doorway-safe-zones] - 2026-07-14

### Added

- Added shared doorway safe-zone collision filtering so trees, lamps, phone boxes, benches, buses, and placed prop pieces cannot block entry triggers.
- Added procedural-world cleanup that removes rendered tree, lamp, and phone-box blockers from generated door approaches.
- Added regression tests for doorway safe-zone collision filtering and procedural door approach clearance.

### Changed

- Indoor player and buddy standing height now uses a dedicated interior floor height to keep characters grounded in rooms.
- Build-piece collision IDs now include the piece kind so only prop blockers are filtered from doorway safe zones.
- Indoor mode no longer evaluates outdoor traffic collision boxes.
- Updated Android version metadata to `1.5.5` / `10505`.

### Fixed

- Fixed indoor buddies/players appearing slightly off the interior floor plane.
- Fixed procedural trees, lamp posts, and phone boxes being able to render or collide in front of enterable doors.
- Fixed player-built prop collision being able to block the approach to an enterable built house/shop/tower.

### Known Issues

- Door safe zones clear collision for blocking props, but user-placed visual props may still remain visible until the player removes or moves them in build mode.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.5.4-enterable-places] - 2026-07-14

### Added

- Added walk-in doorway triggers for static town houses, the coin shop, the school, procedural borough buildings, and player-built houses/shops/towers.
- Added indoor rooms for houses, shops, schools, and building lobbies with walls, furniture, exit pads, labels, and a local buddy inside.
- Added interior collision boxes so players can walk around inside rooms without passing through walls or furniture.
- Added unit tests for static, procedural, and build-mode doorway placement plus interior collision layout.

### Changed

- The HUD and minimap now switch to an indoor context while the player is inside a place.
- Local Party player snapshots include optional interior scope so remote players are only shown in the same indoor/outdoor space.
- Build mode now asks the player to leave a building before placing persistent outdoor world pieces.
- Updated Android version metadata to `1.5.4` / `10504`.

### Fixed

- Fixed the hardcoded controller spawn so entering/exiting rooms remounts at the current saved player position.

### Known Issues

- Interiors are prototype rooms with coarse collision and do not yet include per-building floor plans or bot pathfinding.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.5.3-open-roads-sparse-buildings] - 2026-07-14

### Added

- Added sparse procedural-world layout tests that cap generated building density around the player.
- Added scale coverage for wide sandbox roads with enough room for traffic and player movement.

### Changed

- Widened procedural borough roads and pavements to feel more like an open blocky sandbox town.
- Reduced procedural building density so generated chunks leave more playable open space.
- Build-mode road placement and procedural street-stamp collision tests now use the wider road footprint.
- Updated Android version metadata to `1.5.3` / `10503`.

### Fixed

- Fixed generated trees and phone boxes being able to remain on roads introduced by landmark pieces.
- Fixed stale build-mode placement expectations that still assumed the old narrow road footprint.

### Known Issues

- Android production signing is still not configured; debug APKs remain the expected release artifact.

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

## [v1.4.7-real-world-scale] - 2026-07-13

### Added

- Added a shared world-scale module that treats the current block avatar as a nominal 1.78 m person and derives doors, floors, buildings, cars, buses, lamps, trees, phone boxes, and roads from that ratio.
- Added unit tests that enforce human-scale door height, floor height, car height/length, and integer building floor heights.
- Added procedural-world tests that verify generated buildings are at least two floors high and emit full-height doors.
- Added review screenshots for the corrected phone customizer and gameplay scale.

### Changed

- Rescaled static town buildings, generated borough buildings, landmarks, build-mode houses, towers, shops, cars, trees, lamps, buses, and roads to use the shared real-world ratio.
- Reworked building doors and windows so doors are taller than the avatar and windows are spaced per floor instead of arbitrary rows.
- Increased build-mode footprints and auto-street spacing to match the larger real-world prefabs.
- Updated Android version metadata to `1.4.7` / `10407`.

### Fixed

- Fixed doors rendering far too short compared with the player character.
- Fixed buildings using arbitrary heights that made the character look too large relative to houses and towers.
- Fixed cars and roads using toy-scale dimensions relative to the avatar.

### Known Issues

- The world now uses proportional scale rules, but camera occlusion around very tall nearby buildings is still basic.
- Collision boxes remain coarse axis-aligned blockers; bot pathfinding still does not navigate every obstacle.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.4.6-scale-collision-avatar-preview] - 2026-07-13

### Added

- Added a deterministic 2D collision resolver for direct player movement so visible buildings, cars, trees, lamps, buses, phone boxes, landmarks, and custom build pieces can block the player.
- Added unit tests for collision detection and sliding around visible obstacles.
- Added review screenshots for the real-avatar customizer preview and rescaled gameplay scene.

### Changed

- Increased town and procedural borough building sizes so buildings read as several avatar-heights tall instead of toy-sized props.
- Increased build-mode houses, towers, shops, and cars, and updated their placement footprints to match the larger visible meshes.
- Replaced the character selector/name setup CSS avatar preview with the same 3D `BlockAvatar` renderer used by the actual game character.
- Updated Android version metadata to `1.4.6` / `10406`.

### Fixed

- Fixed the player walking through visible world objects by resolving horizontal movement against visible-object collision boxes.
- Removed the old tight player-position clamp that could feel like an invisible wall in the streamed procedural borough.
- Fixed the real-avatar customizer preview camera so the full character fits in the portrait phone column.

### Known Issues

- Collision boxes are coarse axis-aligned gameplay blockers; bot pathfinding still does not navigate around every custom or procedural obstacle.
- Android production signing is still not configured; debug APKs remain the expected release artifact.

## [v1.4.5-brick-borough-port] - 2026-07-13

### Added

- Added a deterministic procedural borough world generator adapted from the Brick Borough reference, with seeded chunks, roads, pavements, parks, buildings, street props, buses, phone boxes, landmarks, district labels, and night lighting.
- Added world settings for procedural borough enablement, seed editing/randomization, view distance, and night mode.
- Added Brick Borough-style avatar presets, saved avatar styles, JSON project import, texture colour sampling, outfit styles, bottom styles, and shoe styles.
- Added richer in-world block avatar rendering for hair variants, face variants, outfits, bottoms, shoes, and accessory placeholders.
- Added unit tests for Brick Borough avatar import mapping and procedural world determinism.
- Added Playwright smoke coverage for Wardrobe controls and procedural world settings.
- Added review screenshots for the Brick Borough wardrobe customizer and procedural world.

### Changed

- Expanded avatar save data and migration defaults so older local saves receive the new wardrobe fields safely.
- Reworked the Body & Style customizer to include a Wardrobe section while keeping the portrait phone column layout.
- Expanded player movement bounds so the streamed borough can be explored beyond the original town square.
- Reduced procedural scenery shadow casters for better mobile performance.
- Updated Android version metadata to `1.4.5` / `10405`.

### Fixed

- Fixed duplicate React keys in repeated customizer colour palettes.
- Fixed procedural world rendering so it updates by tile crossing rather than subscribing to every player-position frame.

### Known Issues

- Procedural borough scenery is visual-only in this prototype and does not yet add full per-building physics or bot navigation.
- The imported Brick Borough texture sampler maps average colours from known texture regions; it is not a full skin UV editor.

## [v1.4.4-emote-options-row] - 2026-07-13

### Added

- Added production review screenshot for the portrait Emotes & Animations layout.
- Added Playwright smoke coverage that verifies Emotes category options sit below the preview as a horizontal strip and the catalog stays within phone width.

### Changed

- Reworked the portrait Emotes & Animations layout so category options are below the preview instead of a left-side column.
- Gave the emote catalog full phone width on portrait screens and moved quick preview below the catalog.
- Updated Android version metadata to `1.4.4` / `10404`.

### Fixed

- Fixed the portrait Emotes screen pushing the catalog off the right edge because the category rail consumed a full column.
- Fixed the Emotes preview/catalog area crowding the bottom CTA on narrow mobile screens.

### Known Issues

- Emote category buttons are visual filters in this prototype and do not yet filter the catalog items.

## [v1.4.3-customizer-phone-columns] - 2026-07-13

### Added

- Added production review screenshot for the phone-width Body & Style customizer columns.
- Added Playwright smoke coverage that measures the category rail, character column, and controls column in a portrait phone viewport.

### Changed

- Reworked the portrait Body & Style customizer into three columns: compact categories, a 40% character preview column, and a scrollable controls column.
- Expanded the Body & Style section to show skin, hair, eye, accent, hair style, and face controls in the right-side column.
- Enlarged the character preview inside the middle column so colour changes remain visible on phones.
- Updated Android version metadata to `1.4.3` / `10403`.

### Fixed

- Fixed the portrait customizer collapsing the avatar stage to zero width in production-style mobile sizing.
- Fixed colour and style panels crowding the top step indicator or covering the character preview on mobile portrait screens.

### Known Issues

- The customizer still uses procedural CSS/React item art rather than dedicated image sprites for every cosmetic item.

## [v1.4.2-customizer-body-layout] - 2026-07-13

### Added

- Added working Body & Style sub-section state for Body & Style, Hair, Face, and Colours.
- Added Playwright smoke coverage for switching from Colours back to Hair while keeping the avatar visible.

### Changed

- Redesigned the Body & Style customizer layout so portrait phones keep the avatar preview visible while editing colours.
- Reduced compact top-bar pressure so Body & Style titles fit better beside coin and level badges.
- Updated Android version metadata to `1.4.2` / `10402`.

### Fixed

- Fixed colour controls covering the avatar preview on mobile portrait screens.
- Fixed Body & Style section buttons being static, which made the user feel stuck after opening Colours.

### Known Issues

- The customizer still uses procedural CSS/React item art rather than dedicated image sprites for every cosmetic item.

## [v1.4.1-start-flow-menu] - 2026-07-13

### Added

- Added a required Start -> Customization Hub -> character name -> game flow.
- Added a name setup screen that saves the player's character name and uses it for the in-world label, local chat, Local Party identity, and leaderboard.
- Added a single in-game hamburger menu with Customise Character, quests, build mode, shop, buddies, Local Party, leaderboard, badges, emotes, settings, and main menu actions.

### Changed

- Removed splash quick-action shortcuts so new sessions cannot bypass avatar setup.
- Simplified desktop and mobile HUDs to game status only, keeping non-game panels inside the hamburger menu.
- Moved save loading/saving to the app shell so setup changes persist before the 3D world starts.
- Updated Android version metadata to `1.4.1` / `10401`.

### Fixed

- Prevented settings/shop/avatar controls from floating over gameplay and character name labels.
- Ensured quick-reply chat uses the chosen character name instead of the generic `You` label.

### Known Issues

- The startup setup flow is local only; there are no online accounts or cloud profiles.

## [v1.4.0-avatar-customizer] - 2026-07-13

### Added

- Added a full-screen six-step Customization Hub matching the supplied mobile screen direction.
- Added Body & Style, Clothing, Hats & Accessories, Emotes & Animations, and Trails & Effects screens.
- Added original procedural UI assets for avatar previews, clothing cards, hats, accessories, emotes, trails, coins, and collection cards.
- Added richer avatar save fields for hair colour, hair style, face, eye colour, accent colour, pants, top style, accessory, hats, and trails.
- Added catalog data for tops, pants, hats, glasses, headphones, backpacks, pets, effects, emotes, and trails.
- Added purchase/equip logic for customisation catalog items and unit tests for paid unlock behavior.
- Added Playwright smoke coverage for opening the new Customization Hub and stepping into Body & Style.

### Changed

- Replaced the old small Avatar modal with a portrait-first glossy mobile customisation flow.
- Updated the in-game block avatar renderer so hair, pants, hats, face, and accessories reflect selected avatar settings.
- Updated Android version metadata to `1.4.0` / `10400`.

### Fixed

- Kept existing avatar saves compatible while allowing new optional customisation fields.

### Known Issues

- The customiser uses original procedural/CSS item art rather than downloaded third-party accessory sprites.
- Some cosmetic items are visual-only in the customiser and do not yet have distinct 3D geometry in gameplay.

## [v1.3.9-world-builder] - 2026-07-13

### Added

- Added a prefab-based custom world builder with blocks, roads, houses, towers, shops, cars, trees, and lamps.
- Added mobile-friendly Build panel controls for prefab selection, colour swatches, rotation, placement, undo, and Auto Street generation.
- Added a procedural street-map stamp that tiles roads, buildings, props, and cars from a deterministic map pattern.
- Added low-poly prefab renderers for custom world pieces in the 3D scene.
- Added build-mode unit tests for prefab placement, footprint collision, rotation, map generation, and merge filtering.
- Added Playwright smoke coverage for the new Build panel controls.

### Changed

- Existing cube placement remains compatible, but saved custom world pieces can now include kind and rotation metadata.
- Updated Android version metadata to `1.3.9` / `10309`.

### Fixed

- Prevented overlapping custom world pieces with footprint-aware collision checks.
- Added a custom world piece limit to avoid unbounded mobile scene growth.

### Known Issues

- Custom build pieces are visual prefabs; they do not yet add full physics colliders or road navigation paths for bots.
- Debug APK signing is used; production signing is still not configured.

## [v1.3.8-local-party-multiplayer] - 2026-07-12

### Added

- Added a Local Party feature for nearby local players using manual WebRTC invite and answer codes.
- Added live remote-player avatars rendered in the 3D town with synced name, avatar colours, position, yaw, and movement action.
- Added Local Server panel controls for hosting, joining, accepting answer codes, disconnecting, and viewing connected local players.
- Added unit coverage for local party code encoding, decoding, player-name sanitizing, snapshot creation, and stale-player checks.
- Added Playwright smoke coverage for the Local Party UI inside the Local Server panel.

### Changed

- Updated Android version metadata to `1.3.8` / `10308`.

### Fixed

- Kept real nearby players separate from AI buddies so offline bot simulation remains available when no local party is connected.

### Known Issues

- Local Party uses browser/device WebRTC support and manual code exchange. There is no cloud matchmaking, relay, TURN server, or internet game server.
- Debug APK signing is used; production signing is still not configured.

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
