# Build Phases

## Phase 0 - Repo, tooling, and skeleton

- [x] Create Vite React TypeScript app
- [x] Add Tailwind CSS
- [x] Add Three.js, React Three Fiber, Drei, Rapier, Zustand
- [x] Add Vitest
- [x] Add Playwright
- [x] Add ESLint/Prettier setup
- [x] Add Capacitor with Android target
- [x] Add PWA plugin
- [x] Create folder structure
- [x] Create README.md
- [x] Create CHANGELOG.md
- [x] Create PHASES.md
- [x] Create GitHub Actions workflow
- [x] Add placeholder home screen
- [x] Add placeholder game screen
- [x] Add navigation between main menu and game

## Phase 1 - 3D world and player controller

- [x] Add 3D scene
- [x] Add ground plane
- [x] Add spawn, park, shop, school, obby, and houses
- [x] Add third-person camera
- [x] Add blocky player avatar
- [x] Add movement, jump, and camera follow
- [x] Add mobile touch controls
- [x] Add floor collision and interaction zones
- [x] Add basic HUD

## Phase 2 - Simulated player bots

- [x] Add 8 visible bots
- [x] Add usernames, colours, personalities, moods, favourites, schedules, and goals
- [x] Add independent bot wandering and location visits
- [x] Add idle, walk, run, jump, wave, and cheer actions
- [x] Add varied decision timing
- [x] Add floating usernames
- [x] Add tested bot state machine

## Phase 3 - Fake multiplayer chat and speech bubbles

- [x] Add chat panel UI
- [x] Add speech bubbles above bots
- [x] Add safe dialogue templates
- [x] Add local join messages
- [x] Add contextual reactions
- [x] Add player quick replies
- [x] Add tested dialogue selection and sanitising

## Phase 4 - Quests and activities

- [x] Add quest system
- [x] Add five starter quests
- [x] Add quest tracker UI
- [x] Add rewards
- [x] Add bot quest reactions
- [x] Add local quest progress saving
- [x] Add quest state tests

## Phase 5 - Obby mini-game

- [x] Add beginner obby course
- [x] Add checkpoints
- [x] Add timer-ready state
- [x] Add restart control
- [x] Add finish area
- [x] Add cheering bot reactions
- [x] Add reward coins
- [x] Add mobile restart/start control
- [x] Add obby state tests

## Phase 6 - Coins, shop, and avatar customisation

- [x] Add coin balance
- [x] Add shop UI
- [x] Add body colour, shirt colour, hat, and trail placeholders
- [x] Add unlockable items
- [x] Add local avatar persistence
- [x] Add inventory and purchase tests

## Phase 7 - Bot memory and relationships

- [x] Add local bot memory flags
- [x] Track times met, shared quest completions, last interaction, and friendship
- [x] Add memory-aware greetings
- [x] Add friendship UI
- [x] Add in-game schedule slots
- [x] Add relationship tests

## Phase 8 - Offline PWA and mobile polish

- [x] Add PWA manifest
- [x] Add service worker caching
- [x] Add offline fallback
- [x] Add loading/save status
- [x] Add app icon placeholder
- [x] Add graphics quality setting
- [x] Add settings menu
- [x] Add save reset option
- [x] Add audio toggle
- [x] Add reduced motion option

## Phase 9 - Android APK release

- [x] Finalise Capacitor Android integration
- [x] Set app name to BlockBuddies Offline
- [x] Add generated Android icon/splash placeholders
- [x] Build debug APK
- [x] Document signing steps
- [x] Add GitHub Actions Android build
- [x] Add local Android Studio/JBR build instructions
- [x] Sync web build into Android WebView

## Phase 10 - Polish pass

- [x] Improve world visuals
- [x] Add props
- [x] Add bot actions
- [x] Add more dialogue
- [x] Add UI transitions through panels
- [x] Add coin pickup interactions
- [x] Add music/audio toggles
- [x] Improve mobile controls
- [x] Improve accessibility labels and touch targets
- [x] Fix bugs found during testing
- [x] Add README screenshot placeholders and capture instructions

## Post-phase visual asset pass

- [x] Review live UI in desktop and mobile viewports
- [x] Research free/redistributable blocky 3D assets
- [x] Import Kenney CC0 blocky character GLBs and prototype textures
- [x] Replace procedural avatars with licensed blocky character models
- [x] Add spawn studs, roads, storefront signs, benches, lamps, and billboard props
- [x] Add asset manifest and local license records
- [x] Capture updated desktop and mobile review screenshots

## Post-phase mobile character fixes

- [x] Fix player character forward orientation
- [x] Migrate legacy yellow/blue default avatar saves to the newer palette
- [x] Prevent Android text selection/copy menu during gameplay
- [x] Clear stale native WebView service worker caches on Android app startup
- [x] Add unit coverage for avatar migration

## Post-phase mobile gamepad UI

- [x] Collapse mobile chat behind a chat icon
- [x] Replace mobile D-pad with an analog-style joystick
- [x] Add reference-style circular jump and interact controls
- [x] Add compact landscape mobile HUD and side action pills
- [x] Force Android APK orientation to landscape

## Post-phase screen design refresh

- [x] Add chunky BlockBuddies Offline logo and mascot icon
- [x] Redesign splash and main menu from the supplied screen sheet
- [x] Update shared modal/panel styling across feature screens
- [x] Refresh quest, shop, avatar, settings, and buddy profile screens
- [x] Add branded loading fallback for 3D asset loading
- [x] Update favicon/PWA icon assets
- [x] Capture refreshed desktop and mobile review screenshots

## Post-phase responsive APK cleanup

- [x] Add native Android WebView cache/storage cleanup before Capacitor loads
- [x] Bump Android debug APK version metadata to 1.3.4 / 10304
- [x] Tighten short landscape splash/menu sizing for phone viewports
- [x] Keep chat behind the mobile chat icon and hide desktop HUD/chat on landscape phones
- [x] Add safe-area spacing for joystick, jump, interact, side actions, and chat drawer
- [x] Add Playwright smoke coverage for the 1280x576 landscape phone layout
- [x] Capture updated production review screenshots

## Post-phase immersive character fixes

- [x] Hide Android status and navigation bars in immersive sticky fullscreen
- [x] Reapply immersive mode on resume and focus regain
- [x] Replace static in-game character models with animated grounded block avatars
- [x] Add visible walking leg and arm movement for player and buddies
- [x] Rotate moving buddies toward their travel target
- [x] Bump Android debug APK version metadata to 1.3.5 / 10305
- [x] Capture updated grounded gameplay and walking review screenshots

## Post-phase portrait splash fix

- [x] Generate original portrait splash background from supplied composition reference
- [x] Replace two-panel landscape menu with portrait-first poster splash
- [x] Keep Play button and feature strip inside measured Android WebView viewport
- [x] Remove forced Android landscape orientation for splash support
- [x] Harden Android theme against title/action bar viewport loss
- [x] Add visual viewport height CSS variable for Android UI resizing
- [x] Add portrait and constrained landscape splash smoke coverage
- [x] Bump Android debug APK version metadata to 1.3.6 / 10306

## Post-phase splash and overlay polish

- [x] Move splash logo below Android top UI space
- [x] Reduce splash tagline size toward supplied reference
- [x] Raise splash bottom controls and feature strip
- [x] Add larger bottom padding on the splash screen
- [x] Lower 3D HTML label z-index below app panels and chat
- [x] Bump Android debug APK version metadata to 1.3.7 / 10307
- [x] Capture updated splash and overlay review screenshots

## Post-phase local party multiplayer

- [x] Add manual WebRTC host invite code flow
- [x] Add manual WebRTC join answer code flow
- [x] Add Local Server UI for player name, hosting, joining, accepting answers, and disconnecting
- [x] Sync local player position, yaw, avatar colours, and movement action to connected peers
- [x] Render connected local players as live block avatars in the 3D town
- [x] Keep AI simulated buddies active when no local players are connected
- [x] Add unit tests for local party signaling and snapshot helpers
- [x] Add smoke coverage for the Local Party UI
- [x] Bump Android debug APK version metadata to 1.3.8 / 10308

## Post-phase custom world builder

- [x] Add prefab build pieces for blocks, roads, houses, towers, shops, cars, trees, and lamps
- [x] Add mobile-friendly Build panel with prefab selection, colour swatches, rotation, place, Auto Street, and undo
- [x] Add footprint-aware placement checks to prevent overlapping custom world pieces
- [x] Add procedural tiled street-map generation from a deterministic map pattern
- [x] Render custom world pieces as low-poly Three.js prefabs
- [x] Keep legacy saved cube blocks compatible with the new build-piece model
- [x] Add a custom world piece limit for mobile performance
- [x] Add unit tests for prefab placement, rotation, procedural maps, and collision filtering
- [x] Add Playwright smoke coverage for the Build panel world-builder controls
- [x] Bump Android debug APK version metadata to 1.3.9 / 10309

## Post-phase avatar customisation redesign

- [x] Research free/CC0 UI and avatar asset options
- [x] Replace old Avatar modal with a full-screen six-step Customization Hub
- [x] Add Body & Style, Clothing, Hats & Accessories, Emotes & Animations, and Trails & Effects screens
- [x] Create original procedural avatar preview and item-card assets in CSS/React
- [x] Add catalog data for clothing, hats, accessories, emotes, and trails
- [x] Extend avatar saves with optional hair, face, eye, accent, pants, top, accessory, and trail fields
- [x] Reflect richer avatar settings in the in-game block avatar renderer
- [x] Add purchase/equip logic for customisation catalog items
- [x] Add unit tests for customisation purchases and Playwright smoke coverage for the hub
- [x] Bump Android debug APK version metadata to 1.4.0 / 10400

## Post-phase start flow and hamburger menu

- [x] Route Start through character customisation before gameplay
- [x] Add character name setup before entering the 3D town
- [x] Persist the character name with the local save
- [x] Use the character name in the world label, chat, Local Party, and leaderboard
- [x] Replace scattered in-game panel buttons with a hamburger menu drawer
- [x] Add Customise Character to the hamburger menu
- [x] Simplify the desktop and mobile HUD to game status only
- [x] Add unit tests for setup name persistence
- [x] Add Playwright smoke coverage for startup flow and hamburger panels
- [x] Bump Android debug APK version metadata to 1.4.1 / 10401

## Post-phase customizer body layout fix

- [x] Keep the Body & Style avatar preview visible on portrait phones
- [x] Replace static Body/Hair/Face/Colours buttons with working sub-section navigation
- [x] Add focused Body, Hair, Face, and Colours control groups
- [x] Dock mobile colour controls below the avatar instead of over it
- [x] Tighten compact customizer header sizing
- [x] Add smoke coverage for Colours to Hair switching
- [x] Bump Android debug APK version metadata to 1.4.2 / 10402

## Post-phase customizer phone columns

- [x] Convert portrait Body & Style into category, character, and controls columns
- [x] Size the character preview column at 40% of the phone-width customizer
- [x] Keep categories compact on the left rail
- [x] Move all Body & Style controls into a scrollable right-side column
- [x] Expand Body & Style controls to include skin, hair, eyes, accents, hair style, and face expression
- [x] Add measured Playwright regression coverage for the portrait column layout
- [x] Capture production portrait review screenshot
- [x] Bump Android debug APK version metadata to 1.4.3 / 10403

## Post-phase emote options row

- [x] Move portrait Emotes category options below the preview instead of a left column
- [x] Give the portrait emote catalog the full phone width
- [x] Keep quick preview below the catalog and above the CTA
- [x] Add measured Playwright regression coverage for the portrait Emotes layout
- [x] Capture production portrait review screenshot
- [x] Bump Android debug APK version metadata to 1.4.4 / 10404

## Post-phase Brick Borough procedural port

- [x] Review the Brick Borough procedural world and character customisation reference implementation
- [x] Add typed Brick Borough avatar presets and import mapping
- [x] Add local saved avatar styles
- [x] Add JSON project import and texture colour sampling for avatar customisation
- [x] Add outfit, bottom, shoe, face, and hair fields to avatar saves
- [x] Render richer avatar parts in the 3D game scene
- [x] Add deterministic procedural borough generation with tiled roads, parks, buildings, props, landmarks, districts, and night mode
- [x] Add procedural world settings for seed, view distance, enablement, and night mode
- [x] Optimise procedural world updates to run by chunk changes instead of every animation frame
- [x] Add unit tests for avatar import mapping and procedural world determinism
- [x] Add Playwright smoke coverage for Wardrobe controls and world settings
- [x] Capture updated review screenshots
- [x] Bump Android debug APK version metadata to 1.4.5 / 10405

## Post-phase scale, collision, and real avatar preview cleanup

- [x] Increase static town, procedural borough, and build-mode object proportions
- [x] Add visible-object movement collision for buildings, cars, trees, lamps, buses, phone boxes, landmarks, and placed build pieces
- [x] Remove the old tight player-position clamp that created invisible exploration barriers
- [x] Replace selector/name setup CSS avatar with the real in-game `BlockAvatar` renderer
- [x] Add unit tests for movement collision and update smoke coverage for the real avatar preview
- [x] Capture updated customizer and gameplay review screenshots
- [x] Bump Android debug APK version metadata to 1.4.6 / 10406

## Post-phase real-world scale correction

- [x] Add a shared avatar-as-person world scale module
- [x] Derive door, floor, building, car, bus, road, lamp, tree, and phone-box dimensions from real-world ratios
- [x] Rescale static town buildings, procedural borough buildings, landmarks, and build-mode prefabs
- [x] Add unit tests for door/person, floor/person, car/person, and integer-floor building ratios
- [x] Add procedural-world tests for generated building and door scale
- [x] Capture updated customizer and gameplay scale screenshots
- [x] Bump Android debug APK version metadata to 1.4.7 / 10407

## Post-phase road-safe scenery, traffic, and minimap

- [x] Keep procedural park trees and street trees off roads and pavements
- [x] Keep procedural phone boxes off roads and pavements to avoid hidden blockers
- [x] Add deterministic traffic lane/path logic with unit tests
- [x] Render moving low-poly traffic cars along borough road-grid lanes
- [x] Add responsive minimap showing roads, locations, buddies, traffic, and player direction
- [x] Add smoke coverage for minimap visibility in gameplay
- [x] Capture updated phone traffic/minimap review screenshot
- [x] Bump Android debug APK version metadata to 1.4.8 / 10408

## Post-phase traffic completion

- [x] Fix car mesh yaw so vehicles drive lengthwise along lanes
- [x] Fix minimap player arrow rotation for screen-space map direction
- [x] Sync minimap traffic dots with the 3D traffic path clock
- [x] Add moving traffic collision boxes for player movement
- [x] Separate the player from vehicle colliders if traffic moves into them
- [x] Add unit tests for vehicle yaw, traffic collision boxes, player separation, and minimap heading
- [x] Bump Android debug APK version metadata to 1.4.9 / 10409

## Post-phase host-code sharing and camera drag

- [x] Add Copy buttons for Local Party host invite and guest answer codes
- [x] Add Share buttons for Local Party host invite and guest answer codes
- [x] Add Web Share fallback to clipboard for devices without native sharing
- [x] Add full-screen drag-to-look camera control for world view rotation and tilt
- [x] Preserve mobile joystick, jump, interact, and reset controls over the drag layer
- [x] Add unit tests for party-code actions and camera drag clamping
- [x] Add smoke coverage for Local Party code buttons and world drag control
- [x] Bump Android debug APK version metadata to 1.5.0 / 10500

## Post-phase local party code UX fix

- [x] Compress Local Party invite and answer codes into compact `BBP1` codes
- [x] Keep old base64 party codes decodable for existing shared invites
- [x] Replace giant generated code boxes with compact preview cards
- [x] Add Paste buttons for invite and answer code entry
- [x] Extract real party codes from shared text pasted into fields
- [x] Add clipboard fallback when Android WebView rejects modern clipboard writes
- [x] Fall back to copying when native Share fails
- [x] Add same-origin auto handoff for guest answers while preserving host Accept
- [x] Add unit tests for compact code decoding, extraction, paste, and share fallback
- [x] Add smoke coverage for the new Local Party code controls
- [x] Bump Android debug APK version metadata to 1.5.1 / 10501

## Post-phase Android LAN room signaling

- [x] Add Android native LocalSignal Capacitor plugin
- [x] Run a tiny LAN HTTP handshake server on the host APK
- [x] Advertise host rooms with Android Network Service Discovery
- [x] Discover available rooms from guest APKs on the same Wi-Fi
- [x] Fetch host offers and send guest answers through the host room server
- [x] Keep host approval with Accept Join Request
- [x] Move manual invite/answer codes into a fallback section
- [x] Stop room advertising after one local peer connects
- [x] Add Android LAN/network permissions and cleartext allowance for local HTTP
- [x] Add unit and smoke coverage for the room-first Local Party flow
- [x] Bump Android debug APK version metadata to 1.5.2 / 10502

## Post-phase open roads and sparse buildings

- [x] Widen procedural roads for a more open blocky sandbox driving/walking layout
- [x] Widen pavements to preserve clear walking space beside roads
- [x] Reduce generated building density around procedural chunks
- [x] Keep intersection chunks clear of generated buildings
- [x] Remove generated scenery blockers that overlap roads or pavements after landmarks are added
- [x] Add unit coverage for sparse building density, wide road scale, and build-mode footprint updates
- [x] Run lint, typecheck, full unit tests, production build, and Playwright smoke tests
- [x] Bump Android debug APK version metadata to 1.5.3 / 10503

## Post-phase enterable houses and places

- [x] Add doorway triggers for static town places
- [x] Add doorway triggers for procedural borough building doors
- [x] Add doorway triggers for player-built houses, shops, and towers
- [x] Add indoor house, shop, school, and building lobby room layouts
- [x] Add room wall and furniture collision so interiors are playable spaces
- [x] Add exit pads that return the player to the correct outdoor doorway
- [x] Scope Local Party remote avatars to the same indoor/outdoor space
- [x] Add HUD and minimap indoor context
- [x] Guard build mode so persistent outdoor pieces are not placed from indoor coordinates
- [x] Add unit coverage for doorway placement and interior collision layout
- [x] Bump Android debug APK version metadata to 1.5.4 / 10504

## Post-phase doorway safe-zone fix

- [x] Add shared safe-zone collision filtering for doorway approaches
- [x] Remove procedural tree, lamp, and phone-box blockers from generated door approaches
- [x] Keep player-built prop collision from blocking built house/shop/tower doors
- [x] Stop outdoor traffic collision checks while inside rooms
- [x] Ground indoor buddies and players against the interior floor height
- [x] Add unit coverage for safe-zone filtering and procedural door clearance
- [x] Bump Android debug APK version metadata to 1.5.5 / 10505

## Post-phase grounded avatars and preview framing

- [x] Preserve the avatar body base Y offset during idle, walk, run, jump, wave, cheer, and dance animation
- [x] Replace hardcoded outdoor and network avatar standing offsets with the shared measured ground offset
- [x] Tie interior standing height to the same shared avatar ground offset
- [x] Reframe the 3D customization preview so the real in-game avatar has headroom on mobile
- [x] Add unit coverage for avatar foot-bottom math and interior standing height
- [x] Run lint, typecheck, full unit tests, production build, and Playwright smoke tests
- [x] Bump Android debug APK version metadata to 1.5.6 / 10506

## Post-phase original mini-games

- [x] Add an in-game Mini Games panel to the hamburger menu
- [x] Add Coin Rush with timed collectible targets and coin rewards
- [x] Add Delivery Dash with ordered town drop-off pads
- [x] Add Hide & Seek with hidden buddy targets around town
- [x] Add world start pads, active targets, HUD score progress, and mobile cancel control
- [x] Save local mini-game records and award the Mini Game Star badge
- [x] Keep the activities original and avoid Roblox branding, copied assets, or copied game modes
- [x] Add unit tests for mini-game logic and store reward flow
- [x] Add Playwright smoke coverage for the Mini Games panel
- [x] Run lint, typecheck, full unit tests, production build, and Playwright smoke tests
- [x] Bump Android debug APK version metadata to 1.5.7 / 10507

## Post-phase town map and fast travel

- [x] Add a responsive full-town map for desktop, landscape phone, and portrait phone layouts
- [x] Open the full map from both the minimap and hamburger menu
- [x] Add selectable markers for Spawn Plaza, Buddy Park, Coin Shop, Skill School, Beginner Obby, and Buddy Houses
- [x] Add collision-safe arrival points outside buildings and activity geometry
- [x] Exit interiors, clear held controls, and remount the live controller when travelling
- [x] Block fast travel while an obby or timed mini-game is active
- [x] Add controller-generation acknowledgement so stale frames cannot cancel a teleport
- [x] Add unit and Playwright coverage for destination data, travel state, mobile layout, and live teleport behavior
- [x] Run lint, typecheck, full unit tests, production build, full Playwright tests, Capacitor sync, and Android debug build
- [x] Bump Android debug APK version metadata to 1.5.8 / 10508
