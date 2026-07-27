# BloxBuddies Offline — Buddy Rush Feature Brief

**Status:** Proposed  
**Working feature name:** Buddy Rush  
**Game:** BloxBuddies Offline  
**Target platforms:** Web and Android  
**Primary mode:** Offline single-player with simulated multiplayer AI  
**Audience:** Children and families  

---

## 1. Purpose

This brief defines a new central gameplay loop for **BloxBuddies Offline** inspired by the strongest design principles behind collection-and-defence games such as *Steal a Brainrot*.

The objective is not to copy another game's characters, visual identity, conveyor system, weapons, base layout, terminology or exact progression. Instead, BloxBuddies should adopt the parts of the formula that players respond to most strongly:

- Collecting rare, visible characters.
- Building something that other characters can visit and admire.
- Passive progress combined with active decisions.
- Timed vulnerability that creates tension.
- Short pursuit, escape and rescue sequences.
- Rare variants that create memorable jackpot moments.
- Long-term prestige progression.
- Events that temporarily change the whole town.
- Social stories involving rivalry, revenge, rescue and cooperation.

The proposed BloxBuddies version is a child-friendly system called **Buddy Rush**.

> **Collect unusual Buddies, build a living clubhouse, earn rewards from their activities and protect their Friendship Badges when rival AI players launch a Buddy Rush.**

---

## 2. Existing Game Fit

BloxBuddies Offline already includes or plans to include:

- A Roblox-style explorable town.
- Offline play.
- AI-controlled simulated players.
- Simulated multiplayer chat.
- Character customisation.
- Clothing, accessories, emotes, trails and animations.
- Pets.
- Quests.
- Coins and account levels.
- Mini-games such as obstacle courses.
- Friendship profiles and memory notes.
- Mobile controls.
- Responsive web support.

Buddy Rush should connect these existing systems into one recognisable main loop rather than existing as an isolated mini-game.

---

## 3. Product Goals

### 3.1 Primary goals

1. Give BloxBuddies one clear central gameplay hook.
2. Make AI players feel socially meaningful rather than decorative.
3. Make the town, pets, mini-games, quests, customisation and friendship systems support one another.
4. Provide tension and excitement without permanent loss.
5. Create short, shareable stories during every session.
6. Make the offline world feel active and unpredictable.
7. Give players both short-term and long-term collection goals.

### 3.2 Player fantasy

The player should feel that they are:

- Building the best Buddy Clubhouse in town.
- Discovering unusual and lovable Buddies.
- Showing off rare Buddy Styles.
- Forming relationships with AI characters.
- Protecting their collection.
- Sneaking into rival clubhouses.
- Escaping through the town during a chase.
- Rescuing Buddies when rivals get away.
- Moving into increasingly exciting neighbourhoods.

### 3.3 Non-goals

The feature must not:

- Permanently delete or transfer a child's Buddy.
- Encourage real-money pay-to-win behaviour.
- Reproduce the exact mechanics, presentation or branding of another game.
- Use violent weapons or realistic combat.
- Require an internet connection.
- Depend on real human players to remain interesting.
- Allow one AI rival to repeatedly bully the player.
- make collection value depend only on income generation.

---

## 4. Core Gameplay Loop

The recommended loop is:

> **Explore → recruit Buddies → display them in a clubhouse → assign activities → earn coins → visit rival clubhouses → capture a Friendship Badge → escape → defend and rescue → upgrade → advance neighbourhood.**

A typical ten-minute session should include:

1. Collect clubhouse earnings.
2. Speak to Buddies and AI friends.
3. Complete a quest or mini-game.
4. Attend a Buddy Bus arrival or world encounter.
5. Recruit or discover a new Buddy.
6. Assign the Buddy to a clubhouse activity.
7. Receive a Clubhouse Shield warning.
8. Defend against an AI rival or launch a Buddy Rush.
9. Complete an escape, chase or rescue.
10. Spend rewards on an upgrade, item or customisation.
11. See a town event begin or progress towards the next neighbourhood.

---

## 5. Core Terminology

| Term | Definition |
|---|---|
| **Town Buddy** | A full-sized AI-controlled resident who explores, chats, competes and forms relationships with the player. |
| **Collectable Buddy** | A smaller character, creature, pet or robot that lives in a clubhouse and provides abilities or bonuses. |
| **Clubhouse** | The player's customisable home base and public collection display. |
| **Buddy Rush** | A timed raid window during which a rival may attempt to capture one Friendship Badge. |
| **Friendship Badge** | The temporary objective associated with a collectable Buddy. Capturing it causes that Buddy to visit the rival clubhouse for a limited time. |
| **Clubhouse Shield** | A timed protection system that prevents raids outside Buddy Rush windows. |
| **Buddy Style** | A rare visual and mechanical variant such as Golden, Neon, Frost or Galaxy. |
| **Talent** | A Buddy personality modifier such as Speedy, Clever, Lucky or Protective. |
| **BuddyBook** | The long-term collection catalogue. |
| **Neighbourhood Rank** | The prestige progression system that replaces a conventional rebirth. |

---

## 6. Collectable Buddies

### 6.1 Buddy categories

Collectable Buddies can include:

- Animals.
- Fantasy creatures.
- Robots.
- Tiny human or block characters.
- Seasonal visitors.
- Event characters.
- Miniature versions of Town Buddies.

Examples:

| Buddy | Category | Talent | Main benefit |
|---|---|---|---|
| BoltBot | Robot | Builder | Improves clubhouse upgrade speed. |
| Momo Monkey | Animal | Scout | Detects approaching rivals. |
| Bouncy Bunny | Animal | Speedy | Improves chase movement. |
| Ember Dragon | Fantasy | Protective | Extends defensive effects. |
| Disco Duck | Performer | Musical | Improves entertainment rewards. |
| PixelPete Jr | Mini Buddy | Clever | Improves arcade station output. |

### 6.2 Required Buddy properties

Each Buddy should contain:

- Unique identifier.
- Display name.
- Family or category.
- Rarity.
- Base appearance.
- Buddy Style.
- Talent.
- Personality.
- Favourite activity.
- Passive clubhouse bonus.
- Active or contextual ability.
- Friendship level.
- Happiness state.
- Current location.
- Current assignment.
- Capture eligibility.
- BuddyBook discovery state.

### 6.3 Recommended rarity tiers

Use clear but original terminology:

1. Everyday
2. Unusual
3. Rare
4. Epic
5. Superstar
6. Secret

Rarity must be visually readable through:

- Nameplate treatment.
- Particle effects.
- Animation quality.
- Audio sting.
- BuddyBook frame.
- Bus arrival presentation.

Rarity must not be represented only through colour because of accessibility requirements.

---

## 7. Buddy Discovery and Recruitment

### 7.1 Buddy Bus

The central town square should include a **Buddy Bus Stop**.

Every few minutes:

1. A countdown becomes visible.
2. A colourful bus arrives.
3. Three to six Buddies step out.
4. Their silhouettes and rarity hints are shown.
5. Each offers a small recruitment challenge.
6. The player or AI rival who completes the challenge earns the recruitment opportunity.

Possible challenges:

- Bring a requested item.
- Finish a short race.
- Perform the correct emote.
- Complete a small obstacle course.
- Find a missing suitcase.
- Score a goal.
- Solve a visual puzzle.
- Escort the Buddy to a destination.

### 7.2 Additional discovery routes

Buddies may also appear through:

- Wandering town encounters.
- Pet rescue quests.
- Eggs.
- Secret locations.
- Mini-game rewards.
- Daily events.
- Seasonal events.
- BuddyBook set completion.
- Neighbourhood advancement.

### 7.3 Recruitment rules

- A recruitment challenge should normally take 15 to 60 seconds.
- Rare Buddies should require performance, discovery or preparation rather than simply a larger coin cost.
- Failed challenges should provide partial progress or a consolation reward.
- Offline AI opponents must not always complete challenges perfectly.
- New players must receive favourable early encounters.

---

## 8. Living Clubhouses

### 8.1 Clubhouse purpose

The clubhouse is simultaneously:

- A public collection display.
- A passive economy.
- A customisation space.
- A defence objective.
- A social location.
- A progression system.

### 8.2 Buddy behaviours

Buddies should visibly:

- Walk around.
- Sleep.
- Cook.
- Dance.
- Play games.
- Talk to one another.
- Use furniture.
- Exercise.
- Tend gardens.
- Play with pets.
- Perform assigned jobs.
- React to the player entering.
- React to a Buddy Rush warning.

### 8.3 Activity stations

Suggested stations:

- Bakery.
- Toy workshop.
- Music studio.
- Garden.
- Arcade.
- Pet centre.
- Science lab.
- Fashion studio.
- Movie stage.
- Sports court.

Each station should have:

- A visual activity loop.
- A preferred Talent.
- A reward type.
- An upgrade level.
- A maximum number of assigned Buddies.
- One or more furniture requirements.

### 8.4 Public display value

Visitors should be able to immediately understand:

- The owner's rarest Buddy.
- Clubhouse level.
- Neighbourhood Rank.
- BuddyBook completion.
- Mini-game trophies.
- Clubhouse theme.
- Active guard pet.
- Recent rescue streak.

---

## 9. Buddy Rush

### 9.1 High-level rules

Buddy Rush creates timed vulnerability without permanent loss.

Recommended initial timings:

- Protected period: 4 minutes.
- Warning period: 20 seconds.
- Rush period: 60 seconds.
- Recovery shield after a completed raid: 2 minutes.

These values must be configurable through data, not hard-coded.

### 9.2 Capture flow

During an active Rush period:

1. A rival enters the clubhouse.
2. The rival approaches one eligible Buddy.
3. The rival holds the interaction control for approximately two seconds.
4. The Buddy's Friendship Badge is captured.
5. The Buddy begins following the rival.
6. The rival must escort it to their own clubhouse.
7. The owner can chase and tag the rival or Buddy.
8. A successful defensive tag sends the Buddy home.

### 9.3 Escape outcome

If the rival reaches their clubhouse:

- The Buddy becomes a temporary visitor for five to ten minutes.
- The rival receives a temporary version of the Buddy's passive bonus.
- The original owner receives a Rescue Quest.
- Friendship level and ownership remain unchanged.
- The BuddyBook entry remains unchanged.
- The Buddy automatically returns when the timer expires.

### 9.4 Child-safety and frustration protections

1. A Favourite Buddy cannot be captured.
2. Buddies are never permanently deleted or transferred.
3. Only one Buddy may be captured from a clubhouse per Rush.
4. The same rival cannot raid twice consecutively.
5. New players receive extended protection.
6. Recently raided players receive a recovery shield.
7. A failed rescue shortens the remaining visit timer.
8. Capture never resets friendship or Buddy Style.
9. AI difficulty adapts to player performance.
10. A clear parent-friendly option can disable Buddy Rush entirely.

### 9.5 Optional modes

- **Friendly Mode:** Badge capture becomes a game of tag with no temporary bonus loss.
- **Standard Mode:** Uses the full temporary visitor rules.
- **Reduced Tension Mode:** Longer shields and shorter capture timers.

---

## 10. Chases and Escape Routes

Buddy Rush should make the existing town part of the main loop.

Add routes such as:

- Park shortcuts.
- Alleys.
- Rooftop paths.
- Jump pads.
- Underground tunnels.
- Ziplines.
- Moving buses.
- Breakable fences.
- Obby shortcuts.
- Talent-locked doors.

While escorting a captured Buddy:

- The carrier moves slightly slower.
- Some movement gadgets remain available.
- The carrier cannot immediately teleport home.
- The defender receives a directional clue.
- The Buddy visibly reacts to danger and nearby allies.

Routes should support multiple strategies rather than one optimal path.

---

## 11. Prank Gadgets

Weapons should be replaced with playful, non-violent gadgets.

### 11.1 Offensive gadgets

| Gadget | Effect |
|---|---|
| Bubble Blaster | Briefly traps a rival in a bubble. |
| Sticky Cupcake | Creates a temporary slowing area. |
| Disco Bomb | Triggers a short dance animation. |
| Spring Glove | Pushes a rival backwards. |
| Paint Popper | Temporarily adds harmless paint effects around the screen. |

### 11.2 Defensive gadgets

| Gadget | Effect |
|---|---|
| Buddy Whistle | Pulls a captured Buddy slightly towards the owner. |
| Instant Doorbell | Returns the owner to the clubhouse entrance. |
| Decoy Buddy | Creates a fake target. |
| Shield Bubble | Protects one Buddy briefly. |
| Tracker Drone | Reveals the rival's recent route. |

### 11.3 Movement gadgets

| Gadget | Effect |
|---|---|
| Jump Boots | Grants one powerful jump. |
| Cardboard Box | Briefly hides the player's nameplate. |
| Portal Chalk | Creates a temporary two-way portal. |
| Roller Skates | Gives a speed burst with reduced turning control. |

### 11.4 Gadget design requirements

- Cooldown-based rather than heavily consumable.
- No damage values.
- Clear counterplay.
- Strong visual and audio feedback.
- Reduced-motion alternatives.
- AI players must understand basic gadget use.
- No purchasable gadget may provide an unbeatable advantage.

---

## 12. Buddy Styles and Talents

### 12.1 Buddy Styles

Suggested initial Styles:

- Golden.
- Neon.
- Frost.
- Candy.
- Galaxy.
- Shadow.
- Rainbow.
- Clockwork.
- Garden.
- Crystal.

A Style may change:

- Materials and colours.
- Idle animation.
- Particle effect.
- Audio cue.
- Activity output modifier.
- Contextual ability.
- BuddyBook entry.

### 12.2 Talents

Suggested Talents:

- Speedy.
- Clever.
- Lucky.
- Strong.
- Musical.
- Friendly.
- Sneaky.
- Protective.

A Buddy should normally have one Style and one Talent.

Example:

> **Galaxy Momo Monkey — Sneaky**

Duplicate Buddies remain useful because players may seek a specific Style and Talent combination.

---

## 13. Friendship and Memory

Friendship should be a major differentiator for BloxBuddies.

Friendship increases when the player:

- Completes an activity with a Buddy.
- Rescues it.
- Gives it a suitable gift.
- Places it in a favourite room.
- Wins a mini-game with it.
- Uses its special ability.
- Protects it during a Rush.

Higher friendship may unlock:

- New dialogue.
- Personal quests.
- Emotes.
- Outfits.
- Stronger abilities.
- Clubhouse furniture.
- Unique animations.
- Permanent portraits or badges.

Buddies should remember recent events and produce suitable dialogue, for example:

- "That chase was exciting!"
- "Thanks for bringing me home."
- "I liked visiting LilyPixel, but I missed our clubhouse."
- "Can we try the arcade today?"

The tone should avoid framing temporary visits as traumatic or violent.

---

## 14. AI Rival Design

AI residents must create the unpredictability normally supplied by online players.

### 14.1 Recommended archetypes

| AI archetype | Behaviour |
|---|---|
| Friendly | Invites the player to activities and rarely raids. |
| Competitive | Plays mini-games often and targets valuable rewards. |
| Collector | Prioritises BuddyBook completion and offers trades. |
| Protector | Focuses on defence and rescue. |
| Prankster | Uses gadgets frequently but avoids repeated targeting. |
| Sneaky | Watches shield timers and uses hidden routes. |
| Builder | Prioritises clubhouse design and activity stations. |

### 14.2 AI memory

Each AI player should track:

- Friendship with the player.
- Rivalry score.
- Last raid result.
- Last mini-game result.
- Recent gifts.
- Buddies wanted for its collection.
- Whether the player recently helped it.
- The player's commonly used routes and gadgets.
- Whether it has recently targeted the player.

### 14.3 Fairness constraints

- AI must make believable mistakes.
- AI cannot know hidden player state without an in-world reason.
- AI must respect cooldowns.
- AI cannot target the player continuously.
- Difficulty should scale slowly.
- Failed players should receive lighter opposition for a short period.

---

## 15. Simulated Chat

Chat should communicate useful game state and personality.

Examples:

- "Your shield is nearly down!"
- "I spotted a Secret Buddy at the bus stop."
- "Want to play the obby?"
- "I am coming to rescue Momo!"
- "Trade you my Frost Bunny for your Galaxy Duck?"
- "That shortcut was clever!"

Requirements:

- Primarily preset and safe messages.
- Context-aware.
- Optional.
- No real online communication required.
- No implication that an AI character is a real person.
- Messages must match the AI archetype and recent memory.

---

## 16. Pets

Pets should provide gameplay roles rather than being purely cosmetic.

| Role | Ability |
|---|---|
| Guard | Warns when the shield is close to expiring. |
| Tracker | Shows the direction of a captured Buddy. |
| Collector | Picks up nearby rewards. |
| Rescuer | Reduces temporary capture duration. |
| Scout | Reveals rare Buddies in nearby clubhouses. |
| Sprinter | Provides a short chase speed boost. |
| Trickster | Creates a false trail. |
| Comforter | Increases friendship gain. |

The player may equip:

- One adventure pet.
- One clubhouse guard pet.

Pet abilities require clear cooldowns and accessible feedback.

---

## 17. Mini-game Integration

Mini-games must feed the central progression loop.

| Mini-game | Main rewards |
|---|---|
| Obby Race | Movement gadget parts and speed boosts. |
| Football Challenge | Friendship XP and coins. |
| Pet Rescue | Pet eggs and treats. |
| Delivery Dash | Coins and Buddy Bus tickets. |
| Dance Stage | Performer Buddies and emotes. |
| Treasure Hunt | Buddy Style tokens. |
| Cooperative Builder | Furniture and clubhouse parts. |
| Hide-and-Seek | Sneaky Talent rewards. |

Mini-games should influence immediate decisions. For example, a player may complete an obby before a Rush to earn a temporary movement boost.

---

## 18. BuddyBook

The BuddyBook is the long-term collection catalogue.

Each entry contains:

- Hidden silhouette before discovery.
- Name.
- Family.
- Rarity.
- Personality.
- Talent.
- Favourite activity.
- Normal appearance.
- Discovered Styles.
- Friendship level.
- Recruitment location.
- Number of rescues.
- Short animated preview.

Collection rewards may include:

- Clubhouse themes.
- Avatar outfits.
- Emotes.
- Trails.
- Pets.
- Bus designs.
- Special encounters.
- Neighbourhood decorations.

---

## 19. Economy

Keep permanent currencies limited.

### Coins

Used for:

- Furniture.
- Clothing.
- Gadgets.
- Clubhouse upgrades.
- Activity station upgrades.

### Stars or account XP

Used for:

- Account level.
- Feature unlocks.
- Neighbourhood requirements.

### Friendship Hearts

Used for:

- Individual relationship progression.
- Buddy abilities.
- Dialogue and quest unlocks.

Temporary event tokens may exist but should convert to coins when the event ends.

---

## 20. Neighbourhood Advancement

Neighbourhood Rank replaces a conventional rebirth.

Suggested progression:

1. Starter Street.
2. Playtime Park.
3. Sunshine Square.
4. Adventure Avenue.
5. Superstar City.
6. Dream District.
7. Cosmic Community.

Moving neighbourhood may reset:

- Coins.
- Temporary boosts.
- Activity station levels.
- Selected clubhouse upgrades.

The player keeps:

- BuddyBook discoveries.
- Avatar items.
- Emotes.
- Pets.
- Friendship records.
- Buddy Styles.
- Achievements.
- One selected Favourite Buddy.

Higher neighbourhoods unlock:

- Larger clubhouse plots.
- More Buddy slots.
- New town zones.
- Better activity stations.
- New mini-games.
- Additional Buddy families.
- More gadget slots.
- Smarter AI rivals.
- More complex escape routes.

---

## 21. Offline Events

Events must work without a server.

### 21.1 Session events

Occur every 10 to 20 minutes:

- Coin Shower.
- Double Friendship.
- Speedy Buddy Bus.
- Clubhouse Rush.
- Pet Parade.
- Treasure Trail.
- Mystery Visitor.
- Rainbow Weather.

### 21.2 Daily events

A deterministic local calendar can provide the same event for all players on the same date:

- Monday: Mini-game Mayhem.
- Tuesday: Gadget Workshop.
- Wednesday: Friendship Festival.
- Thursday: Rare Buddy Hunt.
- Friday: Clubhouse Party.
- Saturday: Town Takeover.
- Sunday: Pet Parade.

### 21.3 Seasonal events

- Candy Carnival.
- Snow Buddy Festival.
- Space Portal.
- Jungle Adventure.
- Robot Takeover.
- Haunted Clubhouse.
- Summer Beach Party.

Offline date handling must guard against simple clock manipulation where practical, without blocking legitimate device time changes.

---

## 22. User Interface Requirements

New or updated UI should include:

1. Clubhouse Shield timer.
2. Rush warning banner.
3. Buddy capture interaction indicator.
4. Escape destination marker.
5. Defender tracker indicator.
6. Rescue Quest card.
7. BuddyBook screens.
8. Buddy details and friendship panel.
9. Activity station assignment screen.
10. Neighbourhood progression screen.
11. Gadget loadout.
12. Adventure pet and guard pet slots.
13. Event countdown panel.
14. Parent-friendly Buddy Rush setting.

### Accessibility

- Support reduced motion.
- Avoid colour-only rarity communication.
- Provide readable text scaling.
- Provide controller, keyboard, touch and mouse support where applicable.
- Use clear icons with labels.
- Avoid rapid flashing.
- Allow music, effects and voice volume to be controlled separately.

---

## 23. Suggested Data Model

Illustrative TypeScript interfaces:

```ts
export type BuddyRarity =
  | 'everyday'
  | 'unusual'
  | 'rare'
  | 'epic'
  | 'superstar'
  | 'secret';

export type BuddyTalent =
  | 'speedy'
  | 'clever'
  | 'lucky'
  | 'strong'
  | 'musical'
  | 'friendly'
  | 'sneaky'
  | 'protective';

export interface BuddyInstance {
  id: string;
  definitionId: string;
  ownerId: string;
  rarity: BuddyRarity;
  styleId: string | null;
  talent: BuddyTalent;
  friendshipLevel: number;
  friendshipXp: number;
  happiness: number;
  isFavourite: boolean;
  activityStationId: string | null;
  visitState: BuddyVisitState | null;
}

export interface BuddyVisitState {
  hostPlayerId: string;
  sourcePlayerId: string;
  startedAtGameTime: number;
  endsAtGameTime: number;
  rescueProgress: number;
}

export interface ClubhouseShieldState {
  phase: 'protected' | 'warning' | 'rush' | 'recovery';
  phaseEndsAtGameTime: number;
  lastRaiderId: string | null;
}

export interface AiRelationshipMemory {
  playerId: string;
  friendship: number;
  rivalry: number;
  lastRaidOutcome: string | null;
  lastMinigameOutcome: string | null;
  recentHelpScore: number;
  recentTargetCount: number;
}
```

All timings, reward values and probability tables should be configuration-driven.

---

## 24. State and Save Requirements

The offline save must persist:

- Owned Buddy instances.
- BuddyBook discoveries.
- Friendship progress.
- Clubhouse layout.
- Activity station assignments.
- Neighbourhood Rank.
- Pet loadout.
- Gadget loadout.
- AI relationships and selected memories.
- Current event state.
- Active temporary Buddy visits.
- Shield phase.

Requirements:

- Atomic save writes.
- Save versioning and migrations.
- Recovery from interrupted writes.
- No negative timers after device suspension.
- Deterministic simulation when resuming.
- Safe handling when the app is closed during a chase or Rush.

Recommended resume rule:

- Active chases are cancelled safely.
- The Buddy returns home or the state resolves through a deterministic, player-friendly rule.
- The player must never lose progress because the app was closed.

---

## 25. Balancing Principles

1. Rare Buddies should feel exciting but not invalidate the rest of the collection.
2. Active play should improve progress without making passive progress meaningless.
3. Passive progress should not replace exploration and mini-games.
4. Capture tension should be meaningful but temporary.
5. A successful defence should feel as rewarding as a successful raid.
6. AI opponents should provide drama, not punishment.
7. Every gadget must have counterplay.
8. Friendship should create benefits that raw rarity cannot replace.
9. No optimal team should remain permanently dominant.
10. Early progression should introduce systems gradually.

---

## 26. First Playable Scope

The first Buddy Rush vertical slice should contain:

- One town map.
- One player clubhouse.
- Three AI rival clubhouses.
- Twelve collectable Buddies.
- Four AI personalities.
- One Buddy Bus encounter.
- Three activity stations.
- Passive coin generation.
- Clubhouse Shield states.
- Friendship Badge capture.
- One chase route with at least two meaningful paths.
- Rescue behaviour.
- Three prank gadgets.
- Two functional pets.
- One Buddy Style.
- Four Talents.
- Basic BuddyBook.
- AI chat reactions.
- Save and resume support.

---

## 27. Implementation Phases

### Phase 1 — Foundations

- Buddy definitions and instances.
- Clubhouse ownership.
- Activity station assignment.
- Passive rewards.
- Save schema and migrations.
- Basic BuddyBook.

### Phase 2 — Buddy Rush Vertical Slice

- Shield state machine.
- Capture interaction.
- Buddy follow behaviour.
- Escape destination.
- Defensive tag.
- Temporary visit state.
- Recovery shield.

### Phase 3 — AI Rivals

- Personality archetypes.
- Raid decision-making.
- Defence and rescue behaviour.
- Fairness limits.
- Contextual chat.
- Relationship memory.

### Phase 4 — Gadgets and Pets

- Gadget loadout.
- Cooldowns.
- Counterplay.
- Pet roles.
- Chase route interactions.

### Phase 5 — Discovery and Events

- Buddy Bus.
- Recruitment challenges.
- Session events.
- Daily offline schedule.
- Rare Styles and Talents.

### Phase 6 — Progression and Polish

- Neighbourhood Rank.
- Expanded BuddyBook rewards.
- Additional clubhouses.
- Additional mini-game integration.
- Accessibility review.
- Balance pass.
- VRT and performance pass.

---

## 28. Testing Requirements

### Unit tests

- Shield state transitions.
- Capture eligibility.
- Favourite Buddy protection.
- Temporary visit expiration.
- Reward calculations.
- AI anti-targeting rules.
- Cooldowns.
- Save migrations.
- Offline event scheduling.

### Integration tests

- Complete raid flow.
- Complete defence flow.
- Complete rescue flow.
- App suspension during each Rush state.
- Neighbourhood advancement.
- Buddy Bus recruitment.
- Pet ability during a chase.
- Gadget counters.

### End-to-end tests

- New player completes first recruitment.
- New player survives first AI raid.
- Player successfully raids an AI clubhouse.
- Player rescues a visiting Buddy.
- Player closes and resumes the app safely.
- Player disables Buddy Rush in settings.

### Visual regression tests

- Shield timer states.
- Rush warning.
- BuddyBook rarity frames.
- Capture state.
- Chase HUD.
- Rescue Quest.
- Reduced-motion variants.
- Mobile portrait and desktop layouts.

### Performance tests

- Multiple active Buddies in clubhouses.
- Several AI players navigating simultaneously.
- Low-end Android target.
- Save and resume speed.
- Long sessions with repeated events.

---

## 29. Acceptance Criteria for the Vertical Slice

The vertical slice is complete when:

1. The player can recruit and place at least one Buddy.
2. The Buddy visibly performs an activity and generates coins.
3. The clubhouse cycles through protected, warning, Rush and recovery states.
4. An AI rival can capture an eligible Friendship Badge.
5. The player can chase and successfully recover the Buddy.
6. The AI rival can occasionally escape successfully.
7. A successfully captured Buddy becomes a temporary visitor and returns safely.
8. Friendship progress and ownership are never lost.
9. The AI does not repeatedly target the player.
10. Closing the app during any state cannot corrupt or remove the Buddy.
11. The entire loop works offline.
12. The loop is playable with touch controls on Android.
13. Reduced-motion mode remains functional.

---

## 30. Final Product Positioning

The central product message should become:

> **Build your Buddy collection, bring your clubhouse to life and protect it when the whole town comes rushing in.**

Buddy Rush gives BloxBuddies the emotional strengths of successful collection-and-defence games while preserving its own identity:

- Friendly rather than destructive.
- Relationship-driven rather than purely economic.
- Offline rather than server-dependent.
- AI-populated rather than empty in single-player.
- Integrated with pets, mini-games and customisation.
- Designed to create excitement without permanent loss.
