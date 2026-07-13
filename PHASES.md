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
