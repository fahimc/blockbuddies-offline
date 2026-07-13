# BlockBuddies Offline

BlockBuddies Offline is a colourful web-first 3D sandbox town where local AI
buddies make the world feel like a small multiplayer server without using the
internet. It is inspired by blocky sandbox play, but it uses original procedural
shapes, UI, names, and dialogue.

## Screenshots

Screenshots are stored in `docs/screenshots/` and `docs/review/`.

![BlockBuddies menu](docs/screenshots/menu.png)

![BlockBuddies game](docs/screenshots/game.png)

![BlockBuddies updated blocky town](docs/review/kenney-final-desktop.png)

![BlockBuddies mobile visual check](docs/review/kenney-final-mobile.png)

![BlockBuddies redesigned menu](docs/review/screen-design-menu-desktop.png)

![BlockBuddies redesigned mobile game UI](docs/review/screen-design-game-mobile-delayed.png)

![BlockBuddies responsive phone menu](docs/review/responsive-cache-fix-phone-menu.png)

![BlockBuddies responsive phone gameplay](docs/review/responsive-cache-fix-phone-game.png)

![BlockBuddies grounded animated phone gameplay](docs/review/immersive-character-fix-phone-game.png)

![BlockBuddies walking animation check](docs/review/immersive-character-fix-phone-walking.png)

![BlockBuddies portrait splash](docs/review/splash-overlay-polish-v137-phone.png)

![BlockBuddies splash in constrained Android landscape viewport](docs/review/splash-overlay-polish-v137-landscape.png)

![BlockBuddies settings overlay polish](docs/review/splash-overlay-polish-v137-settings.png)

![BlockBuddies avatar customizer hub](docs/review/avatar-customizer-v140-hub.png)

![BlockBuddies avatar body and style screen](docs/review/avatar-customizer-v140-body.png)

![BlockBuddies fixed mobile body colours layout](docs/review/avatar-body-layout-v142-phone.png)

![BlockBuddies phone-width customizer columns](docs/review/avatar-body-columns-v143-phone.png)

![BlockBuddies phone emote options row](docs/review/avatar-emotes-options-v144-phone.png)

![BlockBuddies Brick Borough wardrobe customizer](docs/review/brick-borough-customizer-v145-phone.png)

![BlockBuddies procedural borough world](docs/review/brick-borough-procedural-world-v145-desktop.png)

![BlockBuddies real in-game avatar customizer](docs/review/v146-customizer-body-real-avatar-fixed.png)

![BlockBuddies rescaled gameplay world](docs/review/v146-gameplay-scale-collision.png)

![BlockBuddies real-world scale customizer](docs/review/v147-scale-customizer-phone.png)

![BlockBuddies real-world scale gameplay](docs/review/v147-real-world-scale-gameplay.png)

![BlockBuddies traffic and minimap gameplay](docs/review/v148-traffic-minimap-phone.png)

![BlockBuddies completed traffic heading and minimap](docs/review/v149-traffic-complete-phone.png)

## Features

- Bright low-poly 3D town with spawn, park, shop, school, obby, and houses.
- Third-person blocky player with desktop movement and mobile touch controls.
- Eight AI-simulated buddies with usernames, profiles, schedules, moods, goals,
  state transitions, and visible actions.
- Local fake multiplayer chat, speech bubbles, quick replies, join messages, and
  kid-safe dialogue templates.
- Five starter quests, rewards, coin pickups, local progress saving, and bot
  reactions.
- Beginner obby with checkpoints, finish reward, restart/start control, and bot
  cheering.
- Coin shop, unlockable avatar items, body/shirt colours, hat placeholder, and
  trail placeholder.
- Full-screen six-step avatar Customization Hub with Body & Style, Clothing,
  Hats & Accessories, Emotes & Animations, and Trails & Effects screens.
- Body & Style customizer uses phone-width columns for categories, character
  preview, and controls while switching between Body, Hair, Face, Colours, and
  Wardrobe.
- Character customisation and name setup use the same 3D block avatar renderer
  as the in-game player, so selected colours and parts match gameplay.
- Brick Borough-inspired wardrobe controls with local presets, saved avatar
  styles, project JSON import, texture colour sampling, outfits, bottoms, and
  shoe styles.
- Emotes & Animations uses a portrait phone layout with category options below
  the preview and a full-width emote catalog.
- Startup flow now routes Start through character customisation, character name
  entry, and then the 3D town.
- Chosen character names appear above the player, in quick-reply chat, in Local
  Party identity, and in the leaderboard.
- Bot memory, friendship levels, times met, and relationship-aware greetings.
- Offline badges, leaderboard, emotes, build/place mode, and local server list.
- Local Party nearby multiplayer with manual WebRTC invite/answer codes and
  live synced player avatars.
- Local Party invite and answer codes have Copy and Share buttons, using native
  device sharing when available and clipboard fallback otherwise.
- Custom world builder with blocks, roads, houses, towers, shops, cars, trees,
  lamps, rotation, colour swatches, undo, and procedural Auto Street maps.
- Deterministic procedural borough streaming with tiled roads, pavements, parks,
  buildings, street props, buses, phone boxes, landmarks, world seeds, view
  distance, and night mode settings.
- Coarse visible-object collision prevents the player from walking through
  buildings, cars, trees, lamps, buses, phone boxes, landmarks, and placed build
  pieces while still sliding along blocked axes.
- Shared real-world scale rules keep the block avatar, doors, floor heights,
  buildings, cars, roads, trees, and lamps in proportion to a nominal 1.78 m
  person.
- Road-aware procedural placement keeps trees and phone boxes off roads and
  pavements so scenery no longer blocks driving lanes.
- Moving traffic cars follow deterministic procedural road-grid lanes with
  tested wrapping/path logic and moving player collision boxes.
- Responsive minimap shows nearby roads, buddies, landmarks, traffic, and the
  player facing direction with screen-space heading correction.
- Kenney CC0 blocky character models and prototype grid textures.
- In-game hamburger menu keeps customisation, shop, quests, build mode, Local
  Party, badges, leaderboard, emotes, and settings out of the main HUD.
- Landscape mobile game HUD with chat icon, status pills, virtual joystick,
  circular jump, interact, and reset/remove controls.
- Touch and mouse dragging on the world view rotates and tilts the third-person
  camera independently from the movement joystick.
- Redesigned splash/menu, logo, panels, shop, quest log, avatar editor, settings,
  and buddy profile screens inspired by the supplied screen design sheet.
- Responsive landscape phone layout with compact menu cards, chat icon, safe-area
  spacing, and reference-style joystick/jump controls.
- Android immersive fullscreen mode that hides system bars for the game-like
  landscape layout.
- Grounded procedural block avatars with visible walking leg and arm animation.
- Portrait-first splash poster matching the supplied design direction, with a
  generated original town background and responsive Play button placement.
- PWA manifest, service worker offline cache, settings, graphics quality,
  reduced motion, audio/music toggles, and save reset.
- Capacitor Android project with debug APK output.

## Tech Stack

- Vite, React, TypeScript
- Three.js, `@react-three/fiber`, Drei, Rapier
- Zustand
- Tailwind CSS
- localForage / IndexedDB
- Vite PWA plugin
- Capacitor Android
- Vitest and Playwright

## Setup

```bash
npm install
```

## Development Commands

```bash
npm run dev
npm run preview
```

## Test Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run e2e
```

## Build Commands

```bash
npm run build
npm run cap:sync
npm run android:debug
```

## PWA and Offline Notes

The PWA plugin generates a service worker with an offline app shell. The game
does not depend on live servers for bots, dialogue, quests, inventory, memory,
or saves. After the first successful load, the production build is cacheable for
offline play. Current builds use auto-update, client claiming, and outdated cache
cleanup so installed web/PWA sessions pick up new UI bundles more reliably.

Local Party multiplayer is peer-to-peer and uses manual invite/answer codes. It
does not use BlockBuddies cloud servers, matchmaking, accounts, or free-text
chat. WebRTC support and local network/browser permissions can affect whether
two nearby devices connect.

## Android APK Build

Capacitor writes the Android project to `android/`. Debug APKs are built with:

```bash
npm run build
npm run cap:sync
npm run android:debug
```

On this Windows machine, set `JAVA_HOME` to Android Studio's bundled JBR if Java
is not on PATH:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Debug APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`

The `v1.3.4` and later debug APKs clear stale Android WebView cache/storage once for this
app version before the Capacitor web bundle loads. This is intentional so older
installed debug APKs cannot keep showing the pre-refresh menu or always-open
chat UI from an old service worker.

The `v1.3.5` APK also enters immersive sticky fullscreen so Android status and
navigation bars do not shrink the game viewport. If a user swipes the bars back,
the app hides them again when focus returns.

The `v1.3.6` APK removes the forced landscape orientation so the splash can open
in portrait. The splash uses the measured Android WebView height, so the Play
button stays visible when system UI changes the available space.

The `v1.5.0` APK adds Copy/Share actions for Local Party codes and screen-drag
camera control for mobile gameplay.

The `v1.3.8` APK includes Local Party controls in the Local Server panel. Two
devices can exchange host invite and join answer codes to connect through
WebRTC when the device WebView supports peer connections.

The `v1.3.9` APK adds a mobile-friendly custom world builder. The Build panel
can place individual prefabs or stamp a tiled street map generated from a small
procedural layout. Build pieces are saved locally with the rest of the game.

The `v1.4.0` APK replaces the old avatar modal with a portrait-first
Customization Hub. It uses original procedural/CSS avatar and item art for the
supplied screen direction rather than copied Roblox assets.

The `v1.4.5` APK adds the Brick Borough procedural/customizer port: seeded
borough tiles, world settings, richer 3D avatar parts, saved wardrobe styles,
and local JSON/texture import helpers.

The `v1.4.6` APK fixes world scale and movement blocking. Buildings, cars, and
build-mode prefabs are larger, visible scenery blocks the player with coarse
collision, the old tight exploration clamp is removed, and the customizer/name
screens render the real in-game avatar.

The `v1.4.7` APK replaces the remaining arbitrary object-height math with a
shared real-world ratio. Doors, floors, buildings, cars, buses, roads, lamps,
trees, landmarks, and build-mode prefabs are derived from the avatar-as-person
scale and covered by unit tests.

The `v1.4.8` APK keeps procedural trees and phone boxes off roads/pavements,
adds moving traffic cars on tested borough road lanes, and adds the responsive
in-game minimap.

The `v1.4.9` APK fixes car mesh heading, minimap player heading, syncs minimap
traffic to the same path clock as the 3D cars, and completes runtime player
collision against moving traffic.

Release signing is not configured. For a production APK, configure Gradle
signing properties or use Android Studio's signed bundle/APK flow, then run a
release build.

## Project Structure

- `src/game` - 3D scene, world, player, NPCs, physics, interactions
- `src/ui` - menus, HUD, chat, inventory, avatar editor, settings
- `src/state` - Zustand stores
- `src/ai` - simulated player brains, routines, dialogue, goals, memory
- `src/data` - bot profiles, quests, items, world config
- `src/save` - local persistence
- `src/assets` - models, textures, icons, sounds
- `android` - Capacitor Android project
- `docs` - architecture and phase notes

## Phase Roadmap

See [PHASES.md](./PHASES.md).

See [docs/feature-review.md](./docs/feature-review.md) for the current review of
what works, what was fixed, and what remains out of scope for an offline
Roblox-inspired prototype.

## Known Limitations

- This is a complete prototype, not a production-scale multiplayer game.
- Local Party supports nearby manual peer-to-peer sessions only; it has no cloud
  matchmaking, relay/TURN fallback, persistence for remote players, or account
  system.
- Custom world pieces use coarse player collision but do not yet provide full
  rigid-body physics or bot navigation.
- Procedural borough buildings, props, and moving traffic use coarse player
  collision; roads and pavements remain traversable scenery and bots do not yet
  path around every obstacle.
- Camera occlusion around very tall close buildings is still basic.
- Build mode limits custom world pieces to keep mobile scenes responsive.
- Some cosmetic customizer items are visual-only and do not yet have distinct
  3D gameplay geometry.
- Ghost racers are represented by buddy reactions rather than full racing AI.
- The Three.js bundle is large and should be code-split before a store release.
- Android production signing is not configured; release artifacts use debug APKs.
- Full Roblox-platform features such as global multiplayer servers, Robux,
  moderation, voice chat, creator marketplace publishing, and cloud social graph
  are intentionally out of scope for this offline prototype.
- If an older Android debug APK showed old cached visuals after an update,
  install `v1.3.4-responsive-cache-fix` or later; native startup clears stale
  WebView service worker/cache storage before rendering. That cleanup can reset
  local WebView save data on the upgrade where it runs.

## Credits

No Roblox branding, names, logos, assets, UI, or copied content are used.
Runtime third-party assets are listed in
`src/assets/licenses/assets-manifest.json`; the current imported assets are
Kenney CC0 blocky characters and prototype textures.
The portrait splash background is a project-generated original raster asset
created from the supplied composition reference and does not copy Roblox
branding, logos, UI, or characters.
The procedural world and customizer data structures were adapted from the user's
Brick Borough reference implementation in `fahimc/development` and rewritten as
typed React/Three modules for this app.

## License

Prototype project. Add a formal license before public distribution.
