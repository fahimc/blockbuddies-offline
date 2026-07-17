# Changelog

## [Unreleased]

### Added

- Nothing yet.

### Changed

- Nothing yet.

### Fixed

- Nothing yet.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.54-splash-audio-message-icons] - 2026-07-17

### Added

- Added richer message, build, vehicle, and error sound effects to make gameplay feedback feel more like a finished game.
- Added visible floating Message buttons above NPCs, saved friends, and local-party players so players can tap a character to open a predefined-message thread.
- Added smoke coverage for opening buddy messages from an in-world message icon.

### Changed

- Repositioned the portrait splash Start/logo container with absolute viewport centering and stricter visual regression geometry checks.
- Updated Android and package version metadata to `1.5.54` / `10554`.

### Fixed

- Fixed the mobile splash logo and Start button drifting above the true viewport center on browser and Android-style mobile viewports.
- Fixed in-world message affordances being hidden behind the drag/camera layer.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.53-hosted-web-party] - 2026-07-17

### Added

- Added Netlify-hosted web party room signaling so web/PWA players can host or join by room name instead of manually copying WebRTC offer and answer codes.
- Added a Netlify Function backed by Netlify Blobs to store short-lived party room offers and host-approved join answers.
- Added regression tests for hosted room creation, room lookup, join-answer publishing, polling, closing, and server error handling.

### Changed

- Updated the Local Server panel to show Host Web Room and Join Web Room on web while preserving Android LAN discovery and manual code fallback.
- Updated Android and package version metadata to `1.5.53` / `10553`.

### Fixed

- Fixed web local-party onboarding requiring long manual invite and answer codes when the Netlify deployment is available.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.
- Netlify hosted rooms are a signaling/handshake service only. The live game state still syncs peer-to-peer through WebRTC data channels after the host approves a join request.

## [v1.5.52-netlify-web-deploy] - 2026-07-17

### Added

- Deployed the production web version to Netlify at `https://blockbuddies-offline.netlify.app`.
- Added Netlify build configuration for future production web deploys.

### Changed

- Added the local `.netlify` folder to `.gitignore` after linking the Netlify project locally.
- Updated Android and package version metadata to `1.5.52` / `10552`.

### Fixed

- Added a Netlify SPA fallback redirect so app routes resolve to `index.html`.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.51-npc-look-editor] - 2026-07-17

### Added

- Added a full NPC look editor inside the Buddies & NPCs menu with live preview, saved templates, skin tones, shirt, pants, hair, eyes, accent colours, hero skins, hair styles, faces, clothes, accessories, and trails.
- Added regression coverage proving custom NPC looks are applied before creation.
- Added save/load regression coverage proving created NPCs and built world objects restore together from the same save snapshot.

### Changed

- NPC creation now uses the edited draft avatar instead of only copying a selected saved style.

### Fixed

- Fixed NPC creation not allowing players to completely customise the NPC appearance before adding them to the game.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.50-npc-creator] - 2026-07-17

### Added

- Added a Buddies & NPCs menu creator for making new in-game NPC characters from the current character or any saved character style.
- Added tests for creating in-world NPCs from saved character styles and preserving their avatar data through save snapshots.

### Changed

- Renamed the hamburger menu entry from Buddies to Buddies & NPCs to make the new creator easier to find.
- Custom NPCs now share the same message, add/remove, route, and town rendering path as saved game friends.

### Fixed

- Fixed custom NPC creation always cloning and recolouring the current player avatar instead of letting players choose a saved character style.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.49-splash-flex-layout] - 2026-07-17

### Added

- Added mobile regression coverage for splash logo and Start button centering across multiple portrait viewport heights.

### Changed

- Rebuilt the splash Start/logo area as an explicit flex-centered region instead of relying on overlapping grid-row overrides.

### Fixed

- Fixed the splash logo and Start button container drifting out of vertical center on mobile layouts affected by available viewport height.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.48-build-remove-button] - 2026-07-17

### Added

- Added component and mobile Playwright regression coverage to ensure Build Mode exposes only one selected-item Remove action.

### Changed

- Build Mode now keeps selected-item removal in the left build drawer instead of also showing a duplicate bottom-center touch button.

### Fixed

- Fixed Build Mode showing two red Remove buttons when a built item was selected.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.47-build-grid] - 2026-07-17

### Added

- Added deterministic unit coverage for the Build Mode grid overlay following the player across the procedural map.

### Changed

- Build Mode now pages the visible grid around the player's current world position instead of keeping it fixed at the origin.
- The invisible build-selection plane now follows the same grid page as the visible build overlay.

### Fixed

- Fixed the Build Mode grid only appearing over one origin-area patch while the player was building elsewhere on the map.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.46-house-builder] - 2026-07-17

### Added

- Added custom names for player-built houses, including automatic names for new houses and a responsive selected-house editor.
- Added a real house placement preview, stronger door details, and a yellow front-door direction arrow.
- Added deterministic store, persistence, Local Party, interior, UI, and mobile Playwright coverage for house names and rotation.

### Changed

- The Build Mode Rotate control now rotates a selected placed item or the next placement when nothing is selected.
- Built-house names now appear as interior titles and synchronize with Local Party build objects.

### Fixed

- Fixed the featureless build preview making it impossible to determine which direction a house door would face.
- Fixed placed houses having no way to change their orientation or name after placement.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.45-build-mode-selection] - 2026-07-17

### Added

- Added a compact left-side Build Mode catalog with every placeable item available directly from the game HUD.
- Added tap selection for player-built items, a clear yellow world outline, and exact selected-item removal.
- Added deterministic unit and Playwright regression coverage for builder clearance, build selection, removal, and mobile HUD fit.

### Changed

- Build Mode now returns to the world after choosing a piece so mobile players can place it immediately.
- The mobile Remove control now removes the selected item instead of the most recently placed item.

### Fixed

- Fixed houses and other solid builds spawning around the player and trapping the avatar inside their collision bounds.
- Fixed saved or synchronized solid builds leaving an embedded avatar unable to move by resolving overlap to the nearest clear edge.
- Fixed the full-screen camera drag layer intercepting taps on built items while Build Mode is active.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.44-mobile-customizer-collision] - 2026-07-17

### Added

- Added Playwright visual regression baselines for the portrait splash, customization hub, and clothing catalog.
- Added deterministic unit and browser coverage for obby platform geometry, grounded spawning, inactive collision removal, and player movement.

### Changed

- Rebuilt the portrait customization layout as bounded preview, category, catalog, and footer rows that scale to narrow phone viewports.
- Centered the splash logo and Start control vertically within the upper poster region.
- Changed the customization footer to compact Save and primary navigation controls with a separate note row.

### Fixed

- Fixed customization controls, saved-character content, and clothing catalogs overlapping each other on portrait screens.
- Fixed hero-skin and clothing previews overflowing or stretching beyond their item cards.
- Fixed the clothing character preview rendering underneath catalog controls.
- Fixed inactive obby platforms remaining in the town as red blockers.
- Fixed the obby start position placing the avatar inside a platform instead of grounded on its solid top.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.43-onboarding-build-friends] - 2026-07-17

### Added

- Added a first-entry welcome overlay with movement, interaction, and Local Party guidance plus a shortcut into the Tutorial panel.
- Added explicit Save Character controls to the customization flow, automatic character saving when setup completes, saved-character selection, and an editable character name field.
- Added saved custom friends that can be created from the Buddies menu, persisted locally, added to the town, shown on maps, and messaged through predefined inbox threads.
- Added deterministic NPC route behavior so buddies follow schedules and do activities around town instead of only random wandering.
- Added build-mode floor grid and green placement preview using the same placement rules as actual world building.

### Changed

- Reworked the splash screen so the logo and Start button share a centered top container, the logo is larger, the slogan sits below the buttons, the Start button has a press effect, and Remetheia Games appears at the bottom.
- Removed the visible `saved` HUD pill while keeping background autosave active.
- Full map and mini-map now show saved in-world friends and connected Local Party players.
- Buddy message threads now scroll to the newest message automatically.
- Quest progress now starts naturally when gameplay progress happens.
- Build Mode now uses a drawer-style piece selector with drag/tap affordances.
- Updated Android and package version metadata to `1.5.43` / `10543`.

### Fixed

- Removed passive location floor pads, including the misleading yellow circle near Buddy Houses.
- Fixed customization mini avatar previews appearing squashed.
- Fixed the welcome overlay blocking unrelated game controls outside its card.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.42-tutorial-menu] - 2026-07-16

### Added

- Added a Tutorial section to the hamburger menu with mobile-friendly guidance for movement, Local Party, messages, Build Mode, map travel, mini-games, cars, and saving.
- Added UI regression coverage for opening the Tutorial menu item and for the tutorial content.

### Changed

- The game menu now includes Tutorial near the top so new players can learn core flows before opening the feature panels.

### Fixed

- Fixed the game having no in-app help for Local Party setup, synced building, or the main mobile controls.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.41-name-messaging-build-fixes] - 2026-07-16

### Added

- Added regression coverage for nearest-cell build placement when the first forward build cell is blocked.
- Added regression coverage that local-player predefined messages call the Local Party direct-message channel.

### Changed

- Renamed the app/game label from `BlockBuddies Offline` to `BlockBuddies` across web, PWA, Capacitor, Android labels, storage metadata, and brand accessibility labels.
- Build placement now searches nearby legal grid cells before failing, so the Place action can recover from a blocked forward cell.

### Fixed

- Fixed local-party avatar taps being unreliable by adding a dedicated invisible tap target around connected local players.
- Fixed build placement failing silently when the first target cell was occupied or invalid.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.40-app-icon] - 2026-07-16

### Added

- Added the supplied BlockBuddies character-and-robot artwork as the app icon source for PWA and Android launcher assets.
- Added PNG PWA icons at 192px and 512px plus a PNG browser favicon.

### Changed

- Replaced Android launcher icon PNGs across mdpi, hdpi, xhdpi, xxhdpi, and xxxhdpi densities.
- Updated the PWA manifest and HTML metadata to use the new PNG icon assets.
- Updated Android and package version metadata to `1.5.40` / `10540`.

### Fixed

- Fixed the app still using the older generated vector icon instead of the provided production-style icon artwork.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.39-local-party-build-mode] - 2026-07-16

### Added

- Added local-party direct messages so predefined player-to-player messages land in the recipient's inbox with unread state.
- Added runtime sync that merges valid remote build-mode pieces into the saved local custom world.
- Added unit and Playwright coverage for local-party shared build persistence and player inbox messaging.

### Changed

- Local player message threads now preserve non-bot contacts alongside buddy bot threads.
- Remote local-party avatars can be tapped/clicked to open that player's message thread.
- Updated Android and package version metadata to `1.5.39` / `10539`.

### Fixed

- Fixed local-party builds only appearing as temporary remote decorations instead of persisting as saved objects and houses.
- Fixed local-party player contacts not being addressable through the predefined-message inbox.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.38-local-party-sync] - 2026-07-16

### Added

- Added local party host-election metadata so connected players can promote themselves when the current host drops.
- Added synced build-piece payloads to local party snapshots so player-built world objects appear for connected local players.
- Added unit and Playwright coverage for host election and build-object snapshot sharing.

### Changed

- Smoothed remote local-party avatars with frame interpolation instead of snapping directly to each received snapshot.
- Shared local-party build pieces now contribute to doorway and collision checks when they are received from another player.
- Updated Android and package version metadata to `1.5.38` / `10538`.

### Fixed

- Fixed local party clients losing authority when the host disconnects by promoting the surviving client into host state.
- Fixed local party worlds diverging when one player placed build-mode objects.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.37-buddy-message-inbox] - 2026-07-16

### Added

- Added a buddy message inbox with unread badges, per-character threads, and click-to-message support from in-world buddy avatars.
- Added 100 kid-safe predefined messages across greetings, games, quests, building, travel, teamwork, thanks, status, safety, and fun.
- Added deterministic bot replies, speech bubble responses, persisted message threads, and tests for preset data, unread state, sending, replies, save snapshots, and inbox UI behavior.

### Changed

- Replaced the always-visible fake chat panel with a compact messages icon and inbox drawer.
- Updated visible copy from quick chat to local messages where relevant.
- Updated Android and package version metadata to `1.5.37` / `10537`.

### Fixed

- Fixed chat UI taking gameplay space by moving the interaction into an icon-driven inbox flow.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.36-world-tile-map] - 2026-07-16

### Added

- Added `world-map.html`, a responsive bird's-eye developer page that renders the real one-unit terrain and object layers, supports tile inspection, seed/view controls, and JSON export.
- Added map diagnostics and regression tests for forbidden terrain placement, occupied-cell conflicts, road continuity, and vehicle-scale road width.

### Changed

- Rebuilt the road plan around shared horizontal, vertical, and central-avenue coordinates consumed by generation, terrain rules, traffic, and the minimap.
- Moved the school, houses, obby, parking lot, activities, and conflicting trees into validated parcels with clear road, sidewalk, and vehicle space.
- Updated Android and package version metadata to `1.5.36` / `10536`.

### Fixed

- Fixed generated road strips disappearing when one end touched the authored core town.
- Fixed traffic following legacy road coordinates and therefore appearing to drive over grass or stop against mismatched scenery.
- Fixed hidden overlaps between trees, sidewalks, the parking lot, parked cars, the school, coins, and activity footprints.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.35-core-road-cleanup] - 2026-07-16

### Added

- Added regression coverage for authored core road clearance, including activity pads, coins, obby platforms, parking, benches, static buildings, and procedural core suppression.

### Changed

- Protected the handcrafted central town from overlapping procedural roads, pavements, lane markings, parks, and props.
- Moved the school, obby course, benches, billboard, Coin Rush targets, and Delivery Dash pickup/drop-off points onto clear pedestrian/building cells.
- Updated Android and package version metadata to `1.5.35` / `10535`.

### Fixed

- Fixed procedural roads rendering through the central town and making cars, pads, coins, trees, and labels appear to sit in road lanes.
- Fixed the school and obby authored footprints overlapping the central road layout.
- Fixed Delivery Dash starting directly on the pickup target after the route was moved.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.34-layered-world-generation] - 2026-07-16

### Added

- Added a deterministic chunk-planning layer that creates road-served residential, commercial, park, and player-buildable parcels before placing world objects.
- Added Builder Meadows and Clocktower Hall fast-travel destinations.
- Added world-planning documentation and deterministic tests for zoning, terrain, occupancy, road clearance, entrances, buildable lots, and destination travel.

### Changed

- Procedural generation now builds terrain, roads, sidewalks, setbacks, parcels, buildings, parks, and furniture in a fixed semantic order.
- Generated buildings face their nearest road, trees stay inside park parcels, and lamps stay on sidewalk-edge cells.
- District naming and landmarks now use original BlockBuddies locations instead of real-world landmark references.
- Updated Android and package version metadata to `1.5.34` / `10534`.

### Fixed

- Fixed random trees, furniture, coins, and delivery targets appearing on roads or inside other objects.
- Fixed rotated building entrances and occupancy footprints so doors remain reachable and collisions match the visible building.
- Fixed the Clocktower Hall assembly being removed by generation-order occupancy conflicts.
- Fixed the town map legend intercepting taps on the Builder Meadows marker.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.33-hero-skins] - 2026-07-16

### Added

- Added five original superhero-style avatar skins: Sky Guardian, Solar Sprinter, Neon Knight, Forest Defender, and Moon Rescuer.
- Added a Hero Skins tab to the Clothing customizer with live mini-avatar previews.
- Added in-game hero suit rendering with capes, chest emblems, suit trim, gloves, and armour panels.
- Added unit coverage for hero skin catalog data and store application.

### Changed

- Clothing, accessory, emote, and trail catalog tabs now filter their item grids instead of acting as static labels.
- Updated Android and package version metadata to `1.5.33` / `10533`.

### Fixed

- Fixed hero-style full avatar skins not having a dedicated selection path in the existing customizer.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.32-audio-pass] - 2026-07-16

### Added

- Added richer WebAudio sound cues for screen transitions, avatar customization, quick chat, quest completion, badge unlocks, shop unlocks, emotes, sitting, standing, sleeping, waking, build mode, build placement, build removal, obby start, and obby completion.
- Added context-aware procedural music modes for menu, customizer, town, interiors, driving, and mini-games.
- Added unit tests for the expanded audio cue selector and music mode selection.

### Changed

- Moved the shared audio manager to the app root so menu, setup, customization, and gameplay screens can all play audio through the existing settings toggles.
- Updated Android and package version metadata to `1.5.32` / `10532`.

### Fixed

- Fixed menu and customization screens being silent because audio was only mounted inside the gameplay screen.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.31-customizer-grid-fit] - 2026-07-15

### Added

- Added narrow portrait Playwright coverage for the Body & Style customizer at a 576 px Android-style viewport.

### Changed

- Body & Style customization now uses a strict mobile grid with a capped character preview row, five visible category buttons, and a scrollable controls panel.
- Updated Android and package version metadata to `1.5.31` / `10531`.

### Fixed

- Fixed the character preview being too large and visually overlapping the Body & Style category buttons and colour controls on narrower phone screens.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.30-road-surface-driving] - 2026-07-15

### Added

- Added a vehicle regression test for driving forward across low road and driveway surface boxes without invisible blocking.

### Changed

- Vehicle collision now ignores low traversable surface boxes such as roads, pavements, parking slabs, and driveways while preserving collision against real blockers.
- Updated Android and package version metadata to `1.5.30` / `10530`.

### Fixed

- Fixed cars being unable to move forward on open road or driveway areas when a low surface box was included in the driving obstacle list.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.29-road-driving-bounds] - 2026-07-15

### Added

- Added vehicle regression tests that reproduce cars being blocked by the old invisible central-town boundary.
- Added coverage for exiting cars on generated roads beyond the original small town box.

### Changed

- Expanded drivable vehicle movement and exit bounds to match the generated road and traffic network.
- Updated Android and package version metadata to `1.5.29` / `10529`.

### Fixed

- Fixed cars getting stuck or pushed backward by an invisible road boundary while driving along generated roads.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.28-room-entry-facing] - 2026-07-15

### Added

- Added regression coverage for the interior entry yaw and room transition camera reset flags.

### Changed

- Room entry now uses an explicit inward-facing yaw constant.
- Room entry and exit teleport targets now request a camera view reset so the player does not keep an outside orbit angle.
- Updated Android and package version metadata to `1.5.28` / `10528`.

### Fixed

- Fixed entering a room with the camera/facing state pointing back toward the exit, which could send the player straight back out.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.27-doorway-clearance] - 2026-07-15

### Added

- Added regression coverage for clear interior spawn and exterior doorway return positions.

### Changed

- Moved interior arrival deeper into rooms and moved exterior return points farther away from doors.
- Cleared active touch movement on room entry and exit so held joystick input cannot immediately re-trigger the doorway.
- Updated Android and package version metadata to `1.5.27` / `10527`.

### Fixed

- Fixed players getting stuck in enter/exit loops when leaving and re-entering rooms near a doorway.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.26-room-camera-zoom] - 2026-07-15

### Added

- Added a room-only camera zoom slider so players can zoom out or in while inside houses, classrooms, shops, and other interiors.
- Added unit and Playwright coverage for the room camera zoom control.

### Changed

- Increased the default interior camera pullback and widened interior FOV as the slider zooms out.
- Saved the interior camera zoom preference with the existing settings data.
- Updated Android and package version metadata to `1.5.26` / `10526`.

### Fixed

- Fixed interior rooms feeling too close to the player, especially when sitting or near classroom furniture.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.25-traffic-hijack-driving] - 2026-07-15

### Added

- Added Drive Traffic Car indicators on nearby moving traffic cars.
- Added traffic-car takeover so a selected traffic car is removed from traffic simulation and becomes the active drivable car.
- Added tests for traffic lane heading conversion and hijacked traffic HUD labels.

### Changed

- Flipped parked-car spawn heading so forward input drives through the visible front of the car.
- Made procedural roads, sidewalks, parks, and build-mode roads non-solid surfaces so they do not behave like invisible blockers.
- Updated Android and package version metadata to `1.5.25` / `10525`.

### Fixed

- Fixed forward driving moving in the wrong direction from parked cars.
- Fixed hijacked traffic cars leaving an invisible traffic collision copy behind.
- Fixed road and sidewalk surface collision boxes that could block driving or walking.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.24-gta-driving-roads] - 2026-07-15

### Added

- Added a tested player-drive input adapter so forward, reverse, steer, and brake controls have one gameplay contract.
- Added Playwright coverage that verifies a parked car drives forward toward the Buddy Parking driveway.
- Added brighter low-poly headlights, front grille, and rear lights so car direction is visually readable.

### Changed

- Tightened procedural road placement rules around a wider drivable corridor so trees, phone boxes, and lamp groups cannot block lanes.
- Kept valid lamps on sidewalks while removing only the lamp groups that enter the car corridor.
- Updated Android and package version metadata to `1.5.24` / `10524`.

### Fixed

- Fixed the player-driven car direction regression by routing scene controls through the tested driving input helper.
- Fixed scenery that could be technically outside the road mesh but still close enough to block GTA-style driving lanes.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.23-vehicle-clearance-music] - 2026-07-15

### Added

- Added a low-volume procedural background music loop controlled by the existing Music setting.
- Added regression tests for swept player collision, swept car collision, parking clearance, and traffic stopping behind cars.

### Changed

- Expanded the protected Buddy Parking clearance zone so trees, lamps, and procedural scenery are removed from car bay and driveway space.
- Moved the parking sign out of the car bay and removed it from blocking vehicle collision.
- Traffic now stops behind cars ahead in the same lane as well as for pedestrians.
- Updated Android and package version metadata to `1.5.23` / `10523`.

### Fixed

- Fixed cars and characters being able to tunnel through thin objects during larger frame steps.
- Fixed parked cars getting stuck on nearby signs, trees, and lamp posts around Buddy Parking.
- Fixed invisible blockers caused by hiding parking scenery without removing matching static collision.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.22-map-sounds] - 2026-07-15

### Added

- Added WebAudio sound cues for coin gains, menu panels, map/interior travel, vehicle entry/exit, and mini-game start, pickup, completion, and failure events.
- Added unit coverage for sound cue selection and minimap screen-space movement.

### Changed

- Replaced the mini-game-only audio component with a shared game audio cue component.
- Updated Android and package version metadata to `1.5.22` / `10522`.

### Fixed

- Fixed the minimap screen-space coordinate conversion so markers move in the same direction as the player instead of appearing inverted.
- Fixed the minimap player arrow rotation to match the corrected screen-space map direction.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.21-parking-map-driving] - 2026-07-15

### Added

- Added Buddy Parking as a town map destination with a teleport arrival beside a drivable car.
- Added visible parking-lot guidance and always-visible Drive labels over parked cars.
- Added click/tap handling directly on parked cars in addition to the nearby Drive button.
- Added unit and Playwright coverage for parking travel and immediate car driving discoverability.

### Changed

- Updated the parking lot label to tell players to tap a car to drive.
- Updated Android and package version metadata to `1.5.21` / `10521`.

### Fixed

- Fixed the driving feature being hard to discover because cars were not represented as a map destination and the Drive prompt only appeared after finding the parking lot manually.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.20-delivery-dash-route-map] - 2026-07-15

### Added

- Added target-level mini-game coin rewards and time bonuses to the reusable mini-game engine.
- Added active mini-game target helpers shared by HUD, minimap, and town map UI.
- Added Delivery Dash minimap and town map objective markers for the current pickup or drop-off.
- Added Delivery Dash route tests covering pickup order, drop-off coins, time bonuses, map markers, and completion totals.

### Changed

- Rebuilt Delivery Dash as a clearer ordered delivery route: pick up a parcel, then deliver to Park, School, and Houses.
- Updated Delivery Dash rewards to give `+8` coins and `+5s` for each drop-off, plus a `+40` completion reward.
- Updated Delivery Dash HUD, in-world target labels, and mini-game panel copy so the next action is always visible.
- Updated Android and package version metadata to `1.5.20` / `10520`.

### Fixed

- Fixed Delivery Dash starting directly on top of the first objective by moving the start position outside the pickup radius.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.19-coin-rush-hud-performance] - 2026-07-15

### Added

- Added regression coverage proving the coin HUD updates immediately after the first Coin Rush pickup.

### Changed

- Coin Rush pickups now award one spendable coin per collected event coin, plus the existing completion reward.
- Reduced Coin Rush mobile rendering cost by removing per-pickup DOM labels and point lights, and lowering pickup geometry segment counts.
- Reused a shared WebAudio context for mini-game sound effects instead of creating a new context for every pickup tone.
- Updated Android and package version metadata to `1.5.19` / `10519`.

### Fixed

- Fixed the top coin counter staying unchanged while collecting Coin Rush coins.
- Fixed a likely mobile freeze source during Coin Rush by reducing expensive 3D/DOM/audio work on each active pickup.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.18-mini-game-engine-coin-rush] - 2026-07-15

### Added

- Added a reusable mini-game engine for collection and ordered-route game modes.
- Added server-style mini-game start announcements with all-player language and a bold countdown timer.
- Added Coin Rush point scoring, best-points records, glowing point-labelled pickups, and sound effects for starts, pickups, completion, and failure.
- Added end-to-end coverage for Coin Rush popup, points accumulation, rewards, records, mobile HUD, and cancellation.

### Changed

- Updated Coin Rush to start clear of the first pickup so every run begins at `0/8`.
- Updated the mini-game HUD and panel to show progress, points, reward, best points, and timer information.
- Updated Android and package version metadata to `1.5.18` / `10518`.

### Fixed

- Fixed Coin Rush being able to auto-collect a nearby coin immediately after starting.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.17-character-control-mapping] - 2026-07-15

### Added

- Added regression coverage for screen-relative character left and right movement.

### Changed

- Updated Android and package version metadata to `1.5.17` / `10517`.

### Fixed

- Fixed walking character left/right input being mirrored in the game camera view.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.16-driving-control-mapping] - 2026-07-15

### Added

- Added regression coverage for the screen left/right driving control mapping.

### Changed

- Updated Android and package version metadata to `1.5.16` / `10516`.

### Fixed

- Fixed left driving input turning the car right by adapting screen strafe input to the car steering direction.

### Known Issues

- Android artifact is a debug APK. Release signing is still a manual Play Store step.

## [v1.5.15-driving-steering-direction] - 2026-07-15

### Added

- Added steering regression coverage for both right and left car input directions.

### Changed

- Updated Android and package version metadata to `1.5.15` / `10515`.

### Fixed

- Fixed car left/right driving input being reversed.

### Known Issues

## [v1.5.14-driving-controls] - 2026-07-15

### Added

- Added an explicit mobile driving joystick state when the player enters a car.
- Added a dedicated mobile Exit car button while driving.
- Added unit and Playwright coverage for car entry, driving controls, braking, and exit controls.

### Changed

- Mobile controls now switch from normal Run/Emote/Jump controls to Drive/Exit/Brake controls while in a car.
- The old floating in-world Exit car prompt is hidden on mobile so the dedicated exit button is the only phone exit action.
- Updated Android and package version metadata to `1.5.14` / `10514`.

### Fixed

- Fixed vehicle mode still looking too much like the normal walking control layout on mobile.

### Known Issues

## [v1.5.13-menu-reset-emotes] - 2026-07-15

### Added

- Added a hamburger menu Reset to Square command that returns the player to Spawn Plaza.
- Added a compact mobile emote button in the old normal-play reset slot to cycle Wave, Dance, Cheer, and off.
- Added unit and Playwright coverage for menu reset and the mobile emote toggle.

### Changed

- Reset now clears seats, vehicles, sleep, active emotes, active obby state, active mini-games, touch input, and camera orbit by remounting and snapping the player camera.
- The center mobile control remains contextual for build remove and active mini-game cancel, but no longer shows normal-play Reset.
- Updated Android and package version metadata to `1.5.13` / `10513`.

### Fixed

- Fixed reset being exposed as an always-visible gameplay control instead of a menu action.
- Fixed reset returning location without explicitly restoring the default plaza camera view.

### Known Issues

## [v1.5.12-visible-camera-forward] - 2026-07-15

### Added

- Added deterministic tests for deriving movement heading from the visible camera position after left and right orbit.

### Changed

- Forward movement now uses the current on-screen camera-to-player direction instead of only the target orbit yaw, so joystick and keyboard input follow the view while the chase camera eases into place.
- Updated the phone smoke test so it no longer assumes forward movement is tied to a fixed world axis after orbiting.
- Updated Android and package version metadata to `1.5.12` / `10512`.

### Fixed

- Fixed forward input feeling sideways or backward immediately after orbiting the camera left or right.

### Known Issues

## [v1.5.11-camera-relative-movement] - 2026-07-15

### Added

- Added deterministic movement-vector tests for forward, reverse-camera, sideways, diagonal, and camera-heading preservation cases.
- Added a mobile Playwright regression that orbits to the avatar's front before holding joystick-forward.

### Changed

- Walking and running are now relative to the current camera heading, including after full screen-drag orbit.
- The avatar turns toward its actual travel direction while the camera keeps the player's chosen orbit heading.
- Updated Android and package version metadata to `1.5.11` / `10511`.

### Fixed

- Fixed joystick-forward and keyboard-forward moving toward the camera after orbiting to view the avatar from the front.
- Removed diagonal movement speed gain by normalising the combined movement vector.

### Known Issues

## [v1.5.10-world-grid-camera] - 2026-07-15

### Added

- Added a deterministic one-unit invisible world grid with terrain compatibility rules and exclusive object footprint occupancy.
- Added regression coverage for avatar drag rotation, screen orbit input, core coin cells, procedural object occupancy, park clearance, and sidewalk-only lamps.

### Changed

- Character customisation now rotates the real in-game avatar directly by dragging the preview, with a larger mobile preview and no decorative turntable.
- Gameplay screen dragging now provides independent full horizontal and vertical camera orbit in every player pose.
- Indoor cameras stay inside room walls, and waking restores the exact camera yaw, orbit, and pitch used before sleeping.
- Procedural parks, trees, lamps, phone boxes, buildings, and core-town coins now snap to validated terrain cells; sidewalks are wider and lamps sit on their outer edges.
- Updated Android and package version metadata to `1.5.10` / `10510`.

### Fixed

- Prevented the avatar preview floor and rotate control from overlapping customisation options.
- Prevented sleep/wake transitions from replacing the player's camera angle or leaving the camera behind an interior wall.
- Prevented independent world objects, coins, park scenery, and street furniture from sharing cells or spawning on roads.

### Known Issues

## [v1.5.9-saved-character-profile] - 2026-07-15

### Added

- Added Ms Maple as a classroom teacher, a readable lesson whiteboard, a teacher desk, and six student desk stations in school interiors.
- Added reusable chair interactions across classroom chairs, house and lobby sofas, and outdoor benches, with visible chair icons and seated avatar poses.
- Added Buddy Parking with three enterable cars, mobile and desktop driving controls, braking, steering, collision-safe exits, and obstacle/pedestrian collision handling.
- Added deterministic unit tests and desktop/mobile Playwright journeys for classroom lessons, sitting, entering cars, driving, braking, and exiting.
- Added height-aware player gravity with landable solid tops and solid undersides for world, interior, build-mode, traffic, and obby collision objects.
- Added deterministic tests for object-top landing, low-step traversal, ceiling collision, sleep orientation, wake clearance, 2x run speed, rendered traffic height, and procedural road clearance.
- Added a completed-profile save flag so created characters are recognised as returning players on later launches.
- Added focused save-manager regression coverage to prevent autosave from overwriting saved avatars before IndexedDB/localForage finishes loading.

### Changed

- The HUD and touch controls now switch contextually between sit/stand and enter/drive/brake/exit actions.
- World camera dragging continues to orbit while the player is seated or driving, and the customized player avatar is rendered in the active car.
- Mobile Run is now a press-and-hold control and running is exactly twice walking speed; desktop Shift remains hold-to-run.
- Obby checkpoint positions now use the rendered platform tops so players land on the course instead of intersecting its blocks.
- Build-mode and moving-traffic collision heights now match their rendered geometry, including rotated rectangular pieces.
- The main Start button now waits for local save loading, then sends returning players straight into the game with their saved character.
- Completing the name screen now saves the character name and avatar as a durable player profile.
- Updated Android version metadata to `1.5.9` / `10509`.

### Fixed

- Prevented parked cars, classroom furniture, and parking scenery from creating invisible walk-through or exit traps.
- Prevented retiring outdoor/interior controller frames from overwriting acknowledged doorway arrival and return positions.
- Released avatar-preview WebGL renderers when customization steps unmount so repeated editing does not exhaust browser or Android graphics contexts.
- Corrected the bed pose so the avatar faces upward with their head at the pillow.
- Routed bed taps and action-button taps through the same controller transition and moved waking players beside the bed at floor height.
- Prevented players from sinking through furniture and becoming trapped inside collision objects after waking.
- Removed obsolete stationary red procedural buses that occupied live traffic lanes.
- Prevented first-launch autosave from racing stored save loading and replacing a previously created character with defaults.

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
