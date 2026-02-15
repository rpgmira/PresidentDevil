# PresidentDevil — Development Plan

## Game Concept

**Title:** President Devil (a play on Resident Evil)

**Pitch:** "A survival horror where combat becomes uncontrollable."

**Story:** The President of the country is, in fact, the Devil. You play as his
personal assistant / secretary — a woman who discovers the horrifying truth and
must survive the chaos unfolding inside the presidential compound. Think corporate
horror meets demonic apocalypse. She's dressed in secretary attire (pencil skirt,
blouse, heels) — resourceful, not a soldier, improvising with whatever she can find.

**Characters:**
- **Protagonist** — Secretary / personal assistant. Dark hair (bob cut), dark suit
  with red tie (or blouse). Starts looking professional, becomes progressively
  bloodied and corrupted as corruption meter rises. Red eyes at high corruption.
- **The President / Devil** — Towering demonic figure. Dark suit (politician look),
  horns, red eyes, sharp teeth, clawed hands. Final boss. His presence is felt
  throughout (propaganda posters, PA announcements, demonic influence).

**Setting:** The Presidential Palace / government compound — offices, hallways,
basements, bunkers, ritual chambers hidden beneath the bureaucracy. What starts
as a normal workplace becomes a hellscape.

**Tone:** Dark, tense, with a satirical undertone. The absurdity of a secretary
fighting demons in a government building is part of the charm.

**Visual Direction:**
- **Color palette:** Bold reds, blacks, whites — propaganda poster intensity
- **Propaganda poster aesthetic** — used in title screen, death screen, loading,
  environmental posters on walls (the Devil's "campaign posters")
- **Corruption visual progression** — protagonist's sprite changes as corruption
  rises (clean → bloodied → red-eyed → partially demonic)
- **Reference art:** See concept art (PRSIDEN'EVIL poster — Secretary in front,
  Devil President looming behind, red/black palette, bats, stars)

A top-down 2D roguelike that blends survival horror with bullet heaven. The player
feels weak and vulnerable during exploration, then overwhelmed by chaotic automatic
combat during panic events. Power doesn't make you safe — it makes you a bigger target.

**Core Loop:** Tension → Chaos → Relief → Vulnerability

1. **Explore** — Dark, claustrophobic procedural rooms. Limited flashlight, scarce resources.
2. **Trigger** — Something sets off a panic event (noise, corruption threshold, entering a room).
3. **Panic / Horde** — Room seals. Enemies flood in. Combat is automatic — player focuses on movement and dodging.
4. **Power Spike** — Temporary weapon evolutions. Player feels overwhelmingly strong.
5. **Aftermath** — Power fades. The world is now more dangerous because of the chaos caused.

**Key Design Principle:** Power creates danger, not safety.
- Fighting increases a noise/corruption meter
- Higher corruption = stronger enemies, more frequent hordes
- Strong builds spawn stronger enemies
- Avoiding fights can be safer — but riskier in other ways

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Engine    | **Phaser 3** (same framework Vampire Survivors used) |
| Client    | HTML + JavaScript (Phaser handles Canvas/WebGL)  |
| Server    | Node.js + ws library (future)                    |
| Hosting   | Any free tier with WebSocket support (future)    |

---

## Phase 1 — Playable Prototype (Single Player)

**Goal:** Nail the core gameplay loop in a single HTML file. No server, no installs — just open in browser.

### 1.1 — Engine Foundation (Phaser 3)
- [x] Phaser 3 project setup (single HTML file or simple bundler)
- [x] Phaser game config (WebGL/Canvas renderer, 60fps)
- [x] Scene management (TitleScene, GameScene, DeathScene)
- [x] Input system (WASD + arrow keys for movement, mouse for aiming/shooting, number keys for inventory)
- [x] Camera system (Phaser camera follows player, smooth lerp)
- [x] Game state management (explore / panic / dead)

### 1.2 — Procedural Dungeon
- [x] Room generation algorithm (random sizes, grid-based placement)
- [x] Corridor connections between rooms
- [x] Tile-based map (walls, floors, doors)
- [x] Collision detection against walls
- [x] Special room types: start room, locked rooms, event rooms

### 1.3 — Player
- [ ] Top-down player character (spritesheet-based)
- [ ] **Sprite animations** (not static like Vampire Survivors):
  - Idle (1–2 frames, subtle breathing/sway)
  - Walk cycle (2–3 frames per direction: up, down, left, right)
  - Melee attack swing (2–3 frames)
  - Ranged attack / shoot (2 frames)
  - Hurt / flinch (1–2 frames)
  - Death (3–4 frames)
- [ ] Phaser spritesheet loader + animation definitions
- [x] Placeholder: colored rectangles with frame-swap to simulate animation until real art is ready
- [x] Smooth movement with collision
- [x] Slow, deliberate walk speed (horror pacing)
- [x] Health system (scarce healing)
- [x] Inventory system (6 slots, expandable later via upgrades)
- [x] Mouse aiming (cursor controls facing direction / ranged targeting)

### 1.3b — Weapon & Equipment System

**Dual-wield concept:** Player always has a melee weapon AND optionally a ranged weapon active simultaneously.

**Controls:**
- **Key 0** = Fists/kicks (always available, no inventory slot, weak but infinite durability)
- **Keys 1–6** = Inventory slots (melee weapons, ranged weapons, ammo, consumables, keys)
- Selecting a **melee item** → becomes auto-attack weapon (replaces fists)
- Selecting a **ranged item** → adds as active ranged weapon WITHOUT deselecting current melee
- **Mouse click** = fire ranged weapon (if one is selected and ammo available)
- **Auto-melee** = triggers automatically when enemies are within ~2 body lengths

**Melee Weapons (auto-attack, proximity):**
- Fists (default, infinite, weak)
- Baseball bat (slow, medium damage, moderate durability)
- Knife (fast, low-medium damage, low durability)
- Chainsaw (high damage, high durability, LOUD — generates extra corruption)
- All melee weapons have **durability** — degrade with each hit
- When durability hits 0: weapon breaks, auto-fallback to fists
- Broken weapons stay in inventory (repairable or discardable)

**Ranged Weapons (manual aim + click):**
- Handgun (medium damage, moderate fire rate)
- Shotgun (high damage, spread, VERY LOUD — high corruption)
- Crossbow (medium damage, silent — low corruption, slow fire rate)
- Grenades (thrown, AOE, consumable — destroyed on use)
- All ranged weapons require **ammo** (ammo takes inventory slots)
- Each ranged weapon type uses its own ammo type

**Noise/Corruption per weapon:**
- Fists / knife / crossbow = quiet (low corruption)
- Baseball bat / handgun = moderate corruption
- Chainsaw / shotgun / grenades = loud (high corruption)

**Inventory pressure:**
- 6 slots must hold: weapons + ammo + health kits + keys
- Ranged weapon + ammo = 2+ slots for one ranged option
- Constant decision: what to carry, what to drop, what to save

### 1.4 — Darkness & Visibility
- [x] Limited visibility radius around the player (always-on dim light)
- [x] Fog of war — explored areas stay dimly visible, unexplored areas are black
- [x] Rooms reveal when entered
- [x] Enemies outside visibility radius are hidden
- [x] Atmospheric darkness (vignette, limited sight range creates tension)

### 1.5 — Enemies
- [x] Basic enemy types (crawlers, lurkers)
- [x] Patrol behavior (wander in rooms)
- [x] Chase behavior (triggered by flashlight / noise / proximity)
- [x] Sound attraction — enemies move toward noise sources
- [x] Enemy spawning based on corruption level
- [x] Death/despawn logic

### 1.6 — Panic Events (Horde Combat)
- [x] Trigger conditions (entering event rooms, corruption threshold, random chance)
- [x] Room sealing animation (doors lock)
- [x] Enemy wave spawning (increasing intensity)
- [x] **Dual-wield combat in action:**
  - Melee auto-attacks when enemies within ~2 body lengths
  - Ranged fires on mouse click (if equipped + ammo)
  - Both can operate simultaneously
  - Forces split-second decisions: save ammo or use it to survive?
- [x] Temporary weapon evolutions (spread shot, piercing, AOE)
- [x] Survival timer / wave counter
- [x] Event resolution (doors unseal, loot drops)
- [ ] Weapon durability drain during panic (melee weapons degrade faster under pressure)

### 1.7 — Corruption / Noise System
- [x] Corruption meter (0–100)
- [x] Actions that increase corruption: combat, running, using loud weapons
- [x] Actions that decrease corruption: hiding, standing still, darkness
- [x] Corruption effects: enemy spawn rate, enemy strength, horde frequency
- [x] Visual feedback (screen edges, color shifts, distortion)

### 1.8 — Items & Interactables
- [x] Keys (open locked doors)
- [x] Health pickups (rare)
- [x] Ammo pickups (per weapon type, scarce)
- [x] Melee weapons (found in rooms, varying rarity)
- [x] Ranged weapons (found in rooms, rare)
- [x] Repair kits (restore durability to broken melee weapons)
- [ ] Weapon upgrade tokens (used during panic events)
- [x] Locked doors (require keys)
- [ ] Shortcuts (one-way doors that unlock from one side)
- [x] Item drop/swap system (drop items to pick up new ones when inventory is full)

### 1.9 — HUD & UI
- [x] Health bar
- [ ] Battery indicator
- [x] Corruption meter
- [x] Minimap (reveals explored rooms)
- [x] Inventory bar (slots 1–6, highlights active melee + active ranged)
- [x] Active weapon display (current melee + current ranged shown)
- [x] Durability bar on active melee weapon
- [x] Ammo counter for active ranged weapon
- [x] Panic event timer/wave indicator
- [x] Screen effects (vignette, shake, flash)

### 1.10 — Run Structure
- [x] Permadeath — death ends the run
- [x] Death screen with run stats (rooms explored, enemies killed, survival time)
- [x] Title screen / start menu
- [x] Run start (place player in starting room)
- [x] Win condition for prototype: survive X panic events or reach exit room

---

## Phase 2 — Polish & Content

**Goal:** Make the prototype feel good. Add variety and replayability.

### 2.1 — Audio (Stubbed in Phase 1)
- [ ] Ambient soundscape (drones, hums, distant noises)
- [ ] Footstep sounds (player + enemies)
- [ ] Heartbeat that intensifies with corruption
- [ ] Panic event music (chaotic, overwhelming)
- [ ] Exploration music (minimal, tense)
- [ ] Jump scare stingers
- [ ] UI sounds (pickups, doors, inventory)

### 2.2 — Visual Polish
- [ ] Sprite-based player and enemies (replace placeholder shapes)
- [ ] Tile art for walls, floors, doors
- [ ] Particle effects (blood, sparks, corruption wisps)
- [ ] Screen shake improvements
- [ ] Lighting improvements (dynamic shadows, flickering)
- [ ] Death animations

### 2.3 — Enemy Variety
- [ ] 3-4 distinct enemy types with unique behaviors
- [ ] Enemy difficulty scaling with corruption
- [ ] Mini-boss enemies in later rooms
- [ ] Enemy visual/audio tells

### 2.4 — Build Variety
- [ ] Multiple weapon base types
- [ ] Weapon evolution trees during panic events
- [ ] Passive items that modify gameplay
- [ ] Build synergies

### 2.5 — Meta-Progression
- [ ] Persistent currency earned per run
- [ ] Unlock permanent upgrades between runs
- [ ] Unlock new starting items
- [ ] Unlock new room types / enemy types
- [ ] Stats tracking across runs

---

## Phase 3 — Multiplayer (Future)

**Goal:** Add online co-op/competitive multiplayer using WebSockets.

### 3.1 — Server Foundation
- [ ] Node.js server with `ws` library
- [ ] Room code system (join by code, like Among Us / Jackbox)
- [ ] Server-assigned player IDs
- [ ] WebSocket connection management (connect, disconnect, reconnect)
- [ ] Game state hosted on server (authoritative)

### 3.2 — Synchronization
- [ ] Sync player positions
- [ ] Sync enemy positions and states
- [ ] Sync item pickups and inventory
- [ ] Sync corruption meter (shared? per-player? TBD)
- [ ] Sync panic events

### 3.3 — Multiplayer Modes (Ideas)
- [ ] **Co-op Survival** — 2-4 players explore together, shared corruption
- [ ] **Asymmetric** — One player is the "Devil" controlling enemy spawns, others survive
- [ ] **Competitive** — Players in separate dungeons, corruption actions affect each other's worlds
- [ ] **Traitor Mode** — One player secretly works against the group

### 3.4 — Security & Anti-Cheat
- [ ] Server validates all actions (movement, combat, pickups)
- [ ] Rate limiting on inputs
- [ ] Server is the single source of truth — never trust the client
- [ ] Sanitize all client messages

### 3.5 — Hosting & Deployment
- [ ] Free tier hosting (Fly.io, Render, Azure Container Apps, or Glitch)
- [ ] Deployment pipeline
- [ ] Scalability considerations (if needed)

---

## Phase 4 — Expansion (Long-term)

- [ ] Multiple biomes / areas (offices, presidential halls, basement, bunker, ritual chambers)
- [ ] Boss encounters at area ends (the President/Devil as final boss?)
- [ ] Story / lore through environmental storytelling (memos, documents, ritual evidence)
- [ ] Daily challenge runs (seeded dungeons)
- [ ] Leaderboards
- [ ] Modding support
- [ ] Mobile touch controls

---

## Sprite Asset List & AI Art Prompts

All sprites are **16x16 pixel art, top-down perspective, dark horror aesthetic**.
Use these prompts with any AI image generator (Copilot Image Creator, Leonardo.ai, Stable Diffusion, etc.).
You may need to upscale or manually clean up results. Generate at higher res and downscale if needed.

> **Tip:** Add to any prompt: *"16x16 pixel art, top-down view, dark muted colors, horror game style, transparent background, no outline glow"*

---

### Player Character — Spritesheet

**Idle (2 frames, 4 directions):**
> "16x16 pixel art spritesheet, top-down view, female secretary character in horror game, pencil skirt, white blouse, dark hair, heels. 2 idle animation frames showing subtle breathing motion. Facing down. Dark muted colors. Black background."

Repeat prompt changing "Facing down" to: *Facing up / Facing left / Facing right*

**Walk Cycle (3 frames, 4 directions):**
> "16x16 pixel art spritesheet, top-down view, female secretary character, pencil skirt, white blouse, heels, walking animation, 3 frames side by side showing step cycle. Facing down. Dark muted palette. Black background."

Repeat for all 4 directions.

**Melee Attack (3 frames):**
> "16x16 pixel art spritesheet, top-down view, female secretary character swinging a weapon downward, pencil skirt and blouse, 3 animation frames showing wind-up, swing, and follow-through. Horror game style, dark palette. Black background."

**Ranged Attack / Shoot (2 frames):**
> "16x16 pixel art spritesheet, top-down view, female secretary character aiming and firing a gun, pencil skirt and blouse, 2 frames, muzzle flash on second frame. Horror game style. Black background."

**Hurt (2 frames):**
> "16x16 pixel art, top-down view, female secretary character flinching in pain, 2 frames, one normal and one recoiling with red flash. Horror game style. Black background."

**Death (4 frames):**
> "16x16 pixel art spritesheet, top-down view, female secretary character collapsing to the ground, pencil skirt and blouse, 4 frames showing progressive fall and death. Blood pool on final frame. Dark horror style. Black background."

---

### Enemies

**Crawler (possessed staff member, crawls on ground):**
> "16x16 pixel art spritesheet, top-down view, horror game possessed office worker crawling on the ground, torn suit, pale gray-green skin, 3 walk frames and 1 idle frame. Arranged in a row. Dark muted colors. Black background."

**Attack animation:**
> "16x16 pixel art spritesheet, top-down view, crawling possessed office worker lunging and biting, torn suit, 2 attack frames. Horror game, dark palette. Black background."

**Death:**
> "16x16 pixel art spritesheet, top-down view, possessed office worker dying and collapsing into blood pool, 3 frames. Horror game style. Black background."

**Lurker (demonic shadow creature, summoned by the President):**
> "16x16 pixel art spritesheet, top-down view, dark shadowy demonic creature with glowing red eyes, 3 walk frames and 1 idle frame. Wispy dark purple and black tones. Horror game style. Black background."

**Lurker Attack:**
> "16x16 pixel art spritesheet, top-down view, shadow creature slashing with claws, 2 attack frames, red claw trails. Horror style. Black background."

**Lurker Death:**
> "16x16 pixel art spritesheet, top-down view, shadow creature dissolving into dark mist, 3 frames. Horror game style. Black background."

**Boss — (Phase 2, but prompt for reference):**
> "32x32 pixel art spritesheet, top-down view, massive demonic horror boss creature, muscular, horns, glowing eyes, towering over 16x16 scale. 2 idle frames, 3 attack frames. Dark red and black palette. Black background."

---

### Melee Weapons (inventory icons + held sprite)

**Fists (icon only, no held sprite needed):**
> "16x16 pixel art icon, clenched fist, dark skin tones, horror game UI style, clean readable icon. Black background."

**Baseball Bat:**
> "16x16 pixel art icon, wooden baseball bat, worn and blood-stained, horror game item. Black background."

**Knife:**
> "16x16 pixel art icon, combat knife with dark handle, blood on blade edge, horror game item. Black background."

**Chainsaw:**
> "16x16 pixel art icon, small chainsaw, red and metallic gray, horror game item. Black background."

---

### Ranged Weapons (inventory icons)

**Handgun:**
> "16x16 pixel art icon, semi-automatic pistol, dark metal, horror game item. Black background."

**Shotgun:**
> "16x16 pixel art icon, pump-action shotgun, dark wood and metal, horror game item. Black background."

**Crossbow:**
> "16x16 pixel art icon, medieval crossbow, wood and iron, horror game item. Black background."

**Grenade:**
> "16x16 pixel art icon, fragmentation grenade, olive green with pin, horror game item. Black background."

---

### Ammo Types (inventory icons)

**Pistol Ammo:**
> "16x16 pixel art icon, small box of pistol bullets, brass and cardboard, horror game item. Black background."

**Shotgun Shells:**
> "16x16 pixel art icon, red shotgun shells, 3-4 shells grouped, horror game item. Black background."

**Crossbow Bolts:**
> "16x16 pixel art icon, bundle of crossbow bolts, wood and iron tips, horror game item. Black background."

---

### Consumables & Pickups (inventory icons)

**Health Kit:**
> "16x16 pixel art icon, small red first aid kit with white cross, horror game item. Black background."

**Key:**
> "16x16 pixel art icon, old rusty iron key, horror game item, dark tones. Black background."

**Repair Kit:**
> "16x16 pixel art icon, small toolbox or wrench with duct tape, worn and grimy, horror game item. Black background."

**Weapon Upgrade Token:**
> "16x16 pixel art icon, glowing red crystal or demonic rune stone, ominous glow, horror game item. Black background."

---

### Environment Tiles (16x16 each)

**Floor — Office Carpet:**
> "16x16 pixel art tile, top-down view, dark blue-gray office carpet floor, worn and stained, seamless tileable, horror game. Muted tones."

**Floor — Marble (presidential halls):**
> "16x16 pixel art tile, top-down view, cracked white and gray marble floor, blood stains, seamless tileable, horror game. Government building."

**Floor — Concrete (basement/bunker):**
> "16x16 pixel art tile, top-down view, cracked concrete floor, dark gray with stains, seamless tileable, horror game."

**Wall — Office:**
> "16x16 pixel art tile, top-down view, beige office wall with wood paneling, government building style, horror game. Seamless tileable."

**Wall — Stone (basement):**
> "16x16 pixel art tile, top-down view, dark stone brick wall, mossy and cracked, horror game dungeon beneath government building. Seamless tileable."

**Wall — Ritual Chamber:**
> "16x16 pixel art tile, top-down view, dark stone wall with demonic runes and blood symbols, glowing faintly red, horror game. Seamless tileable."

**Door — Normal:**
> "16x16 pixel art tile, top-down view, wooden door in door frame, dark brown, horror game. Can be shown open and closed (2 variants)."

**Door — Locked:**
> "16x16 pixel art tile, top-down view, wooden door with iron lock and chains, horror game. Visually distinct from normal door."

**Door — Sealed (panic event):**
> "16x16 pixel art tile, top-down view, door barricaded with red glowing energy or flesh growth, demonic seal, horror game."

**Switch / Lever:**
> "16x16 pixel art tile, top-down view, wall-mounted lever switch, two states: up and down. Rusted metal, horror game."

**Pressure Plate:**
> "16x16 pixel art tile, top-down view, stone pressure plate on floor, slightly raised, cracks around edges, horror game."

---

### Projectiles & Effects

**Bullet:**
> "8x8 pixel art, small yellow bullet projectile with motion trail, side view, dark background."

**Shotgun Spread:**
> "16x16 pixel art, shotgun blast effect, multiple small pellets spreading outward, muzzle flash orange, dark background."

**Crossbow Bolt (in-flight):**
> "8x8 pixel art, crossbow bolt projectile flying, wood and iron, side view, dark background."

**Grenade (in-flight):**
> "8x8 pixel art, small grenade in mid-air arc, olive green, dark background."

**Explosion:**
> "16x16 pixel art spritesheet, explosion animation, 4 frames, orange-red fire expanding, horror game. Dark background."

**Blood Splatter:**
> "16x16 pixel art spritesheet, blood splatter effect, 3 frames, dark red on black background, horror game."

**Corruption Wisps:**
> "16x16 pixel art spritesheet, dark purple-red corruption mist particles, 3 frames of swirling animation, horror game. Black background."

---

### HUD / UI Elements

**Health Heart (full, half, empty):**
> "16x16 pixel art, 3 heart icons side by side: full red heart, half red heart, empty gray heart outline. Horror game UI, clean. Black background."

**Inventory Slot:**
> "16x16 pixel art, empty inventory slot frame, dark gray border with inner shadow, horror game UI. Black background."

**Inventory Slot (selected/active):**
> "16x16 pixel art, inventory slot frame with glowing red border, selected state, horror game UI. Black background."

**Corruption Meter Fill:**
> "Thin horizontal pixel art bar texture, dark purple-red gradient, horror game corruption meter fill. Seamless horizontally."

**Minimap Icons:**
> "8x8 pixel art icon set: small room square (gray), player dot (white), enemy dot (red), door gap (brown), locked door (yellow). Minimal, clean. Black background."

---

### Summary — Total Assets Needed (Prototype)

| Category | Count | Notes |
|---|---|---|
| Player sprites | ~40 frames | 4 dirs × (2 idle + 3 walk + 3 attack + 2 hurt) + 4 death |
| Enemy sprites | ~24 frames | 2 types × (4 idle/walk + 2 attack + 3 death) × rough |
| Weapon icons | 7 icons | Fists, bat, knife, chainsaw, handgun, shotgun, crossbow |
| Ammo icons | 3 icons | Pistol, shotgun, crossbow |
| Item icons | 5 icons | Health, key, repair kit, upgrade token, grenade |
| Environment tiles | ~12 tiles | 3 floors, 3 walls, 3 doors, switch, pressure plate, variants |
| Projectiles/FX | ~20 frames | Bullet, shells, bolt, grenade, explosion, blood, corruption |
| UI elements | ~10 pieces | Hearts, slots, meter, minimap icons |
| **TOTAL** | **~120 frames/icons** | |

---

## Reference Games
- **Vampire Survivors** — Bullet heaven, auto-attack, build choices
- **Darkwood** — Top-down survival horror, flashlight, dread
- **BrowserQuest** (Mozilla) — Open-source browser multiplayer reference
- **.io games** (Agar.io, Surviv.io) — Canvas + WebSocket + Node.js
- **Among Us** — Room code model, server-authoritative
- **Resident Evil** — Resource scarcity, vulnerability, tension pacing

---

## Architecture Notes

**Single Player (Phase 1):**
```
[index.html] → Canvas rendering + Game logic + Input handling
All in one file, no dependencies
```

**Multiplayer (Phase 3):**
```
[Client: index.html] ←WebSocket→ [Server: Node.js + ws]
Client sends inputs → Server runs game logic → Server broadcasts state
```

**Key architectural decision:** Even in Phase 1, keep game state logic
separate from rendering. This makes the Phase 3 multiplayer transition
straightforward — move game state to the server, keep rendering on the client.

---

*Last updated: February 14, 2026*
