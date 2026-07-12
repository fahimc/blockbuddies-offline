# BlockBuddies Offline

BlockBuddies Offline is a colourful web-first 3D sandbox town where local AI
buddies make the world feel like a small multiplayer server without using the
internet.

## Screenshots

Phase 0 includes the menu shell and game placeholder. Final screenshots are added
during the polish phase.

## Features

- Offline-first sandbox structure.
- Main menu and game screen navigation.
- PWA and Capacitor Android foundation.
- Planned 3D town, simulated players, chat, quests, obby, coins, shop, avatar
  customisation, bot memory, and offline saves.

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

The PWA plugin is configured with an offline app shell and auto-updating service
worker. Gameplay systems are designed to run entirely locally.

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

Release signing is not configured yet. Use Android Studio or Gradle signing
properties for a production release APK.

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

## Known Limitations

- Phase 0 is a skeleton. Playable 3D systems begin in Phase 1.
- Android signing is not configured, so debug APKs are produced.

## Credits

No third-party game art or Roblox assets are used. Current visuals are original
CSS/SVG placeholders.

## License

Prototype project. Add a formal license before public distribution.
