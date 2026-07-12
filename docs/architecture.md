# Architecture Notes

BlockBuddies Offline is a web-first sandbox prototype. The React app owns menus,
HUD, chat, inventory, avatar editing, and settings. The Three.js scene owns the
town, avatars, camera, collision surfaces, and obby course. Zustand stores bridge
the UI and game loop.

Core folders:

- `src/game` - 3D scene, town, player, bots, physics, interactions, obby.
- `src/ui` - menus, HUD, chat, shop, avatar editor, settings, mobile controls.
- `src/state` - shared Zustand stores.
- `src/ai` - bot state machines, dialogue, memory, relationship logic.
- `src/data` - profiles, quests, items, world config.
- `src/save` - localForage persistence.
- `src/assets` - game-owned assets.

The game is intentionally offline. Bot chat, schedules, quests, memory, and saves
are all local deterministic systems.
