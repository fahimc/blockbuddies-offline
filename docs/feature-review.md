# Feature Review

## What Works

- Web app starts from the menu and enters the 3D town.
- Desktop smoke test opens the game without console errors.
- Mobile viewport renders touch controls and the HUD without blocking the menu.
- Simulated buddies appear with usernames, chat messages, and local state.
- Quests, coins, shop, avatar customisation, local saves, PWA build, and Android
  debug APK build pass local validation.

## What Was Missing Before This Review

- Mobile HUD overlapped the menu button.
- Touch movement labels were mojibake in source.
- Camera framing was too close on narrow mobile viewports.
- No leaderboard, badges, emotes, build/place mode, or local server/player list.
- The game could not honestly be described as having Roblox-scale platform
  features.

## Added In This Pass

- Offline leaderboard with player and simulated buddy scores.
- Badge system with local achievements.
- Emote panel and visible player/bot emote poses.
- Build panel with block placement, colour selection, undo, and persistence.
- Local server/player list with bot status and invite buttons.
- Mobile HUD spacing and camera framing improvements.

## Still Not In Scope

BlockBuddies Offline is not Roblox and should not try to clone the full Roblox
platform. These features remain intentionally out of scope for an offline
prototype:

- Real multiplayer networking and authoritative servers.
- Real friends/social graph, party chat, voice chat, moderation, or reporting.
- Robux, trading, paid marketplace, or creator payouts.
- User-generated asset publishing, cloud creator tools, or live marketplace.
- Cross-device cloud saves.
- Any Roblox branding, logos, UI, names, or copied assets.
