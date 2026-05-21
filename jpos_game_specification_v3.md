Kérlek, töltsd be és értelmezd a mellékelt .md specifikációs fájlokat, majd ezek alapján hozd létre a teljes projektet Angular + TypeScript + Canvas/Pixi stackkel. A játékot hagymahéj-szerűen implementáld: először a projektstruktúra, majd az OS desktop, ablakkezelő, UI panelek, renderelő réteg, Simulation Engine, tick rendszer, eseményrendszer, dinoszaurusz AI, végül az integráció. A specifikációtól nem térhetsz el, új funkciót nem adhatsz hozzá. Minden lépés előtt készíts rövid tervet, majd valósítsd meg.

# Jurassic Park Operations OS – Copilot Agent Implementációs Indító Prompt

## Feladat

A mellékelt `.md` specifikáció egy teljes, determinisztikus, réteges játékrendszer leírása.  
A feladatod:

1. **Értelmezd és töltsd be a teljes specifikációt**, mint a projekt abszolút forrásigazságát.
2. **Hozz létre egy új Angular alapú projektet**, a specifikációban meghatározott technológiai stack szerint.
3. **A projektet hagymahéj-szerűen építsd fel**, kívülről befelé haladva:
   - teljes projektstruktúra
   - OS desktop és ablakkezelő
   - UI panelek és alkalmazások
   - Canvas/PixiJS renderelő réteg
   - Simulation Engine (tick rendszer)
   - Event System
   - Dinosaur AI
   - teljes integráció
4. **Minden implementációs lépés előtt készíts rövid tervet**, majd valósítsd meg.
5. **A specifikációtól nem térhetsz el.**
6. **Ne találj ki új rendszereket, UI elemeket, dinoszauruszokat vagy funkciókat.**
7. **A determinisztikus tick-alapú szimulációt külön TypeScript modulban valósítsd meg.**
8. **A kamera feedeket GIF-ekkel, sprite sheetekkel vagy Canvas-renderelt statikus képekkel oldd meg.**
9. **A Babylon.js csak opcionális dekorációra használható, nem gameplay-re.**
10. **A teljes projektet modulárisan, tiszta architektúrával építsd fel.**

---

## Technológiai stack (kötelező)

### Frontend

- Angular 17+
- TypeScript strict mode
- Standalone components
- ChangeDetectionStrategy.OnPush

### Rendering

- HTML5 Canvas 2D **vagy** PixiJS
- Babylon.js (opcionális, csak dekoráció)

### Simulation Engine

- tiszta TypeScript modul
- tick-alapú, determinisztikus
- egyetlen globális RNG stream

### Kamera feedek

- GIF
- WebP animáció
- sprite sheet
- Canvas statikus frame + glitch overlay

### Audio

- WebAudio API
- max 4 csatorna

### Mentés

- JSON
- localStorage vagy IndexedDB

---

## Implementációs sorrend (kötelező)

1. Projekt létrehozása
2. Mappa-struktúra kialakítása
3. OS desktop + ablakkezelő
4. UI panelek (Security, Power Grid, Dino Monitor, stb.)
5. Canvas/Pixi renderelő réteg
6. Simulation Engine
7. Tick rendszer
8. Event System
9. Dinosaur AI
10. Integráció
11. Mentési rendszer
12. Végső polish

---

## Követelmény

A végén egy működő, Angular + TS + Canvas/Pixi alapú, determinisztikus, OS-szerű játékot kell kapnunk.

---

## A specifikáció

Kérlek, töltsd be és értelmezd a következő `.md` fájlt:

# Jurassic Park Operations OS – Production Grade LLM Specification

---

# 0. Core Design Philosophy

The game is a:

- realtime system-collapse management simulator
- operational disaster management game
- high-pressure multitasking experience
- deterministic systemic simulation
- cognitive‑load pressure game

The core fantasy is NOT:

- fighting dinosaurs
- exploration
- base building
- crafting
- story campaign gameplay

The core fantasy IS:

- preventing cascading failures
- operating unstable systems
- surviving controlled chaos
- handling information overload
- managing escalating emergencies
- doubting telemetry and making decisions under uncertainty

The player should constantly feel:

> "The park is seconds away from collapse, but maybe I can still recover it."

---

# 1. Scope Definition

The game:

- singleplayer
- realtime tick-based simulation
- fully 2D
- desktop OS simulator
- endless survival game
- deterministic and data-driven
- imperfect‑information management experience

The game is NOT:

- city builder
- sandbox
- RTS
- 3D simulation
- physics simulation
- base building game
- action game

---

# 2. Technical Constraints

## 2.1. Rendering

- 2D only
- Orthographic rendering only
- No 3D assets
- No skeletal animation
- No physics engine dependency
- No ragdoll
- No particle simulation

---

## 2.2. Resolution (Updated for Retro 4:3 Aspect Ratio)

The game MUST use a fixed **4:3 aspect ratio** to reinforce the retro-OS aesthetic.

### Base Resolution (Native)

- **1600×1200** (4:3)

### Minimum Supported Resolution

- **1024×768** (4:3)

### Scaling Rules

- The game MUST maintain a strict 4:3 aspect ratio at all times.
- Scaling MUST use **integer scaling only** (1×, 2×, 3×, …).
- No fractional scaling is allowed.
- No widescreen (16:9, 21:9) layouts are permitted.
- On wider displays, the game MUST be centered with pillarboxing (black bars on left/right).

### UI Layout Constraints

- All UI panels MUST be designed for 4:3 safe zones.
- No UI element may assume a widescreen layout.
- The OS desktop, windows, and panels MUST NOT stretch horizontally beyond the 4:3 frame.
- Camera feeds, maps, and dashboards MUST adapt to the 4:3 frame without cropping.

### Rendering Constraints

- The simulation and UI MUST render internally at the base 4:3 resolution.
- Upscaling MUST be pixel-perfect (nearest-neighbor).
- No smoothing, interpolation, or anti-aliasing is allowed.

### Retro Aesthetic Requirements

- The 4:3 frame MUST emulate:
  - CRT-era workstation proportions
  - square-pixel terminal layouts
  - constrained operator consoles
- The aspect ratio is a **core thematic element**, not optional.

---

## 2.3. Visual Presentation & Jurassic Park OS Aesthetic Specification

The game MUST visually emulate the style of the computer systems seen in the original Jurassic Park trilogy.  
This includes the look and feel of:

- 1990s UNIX workstation interfaces (SGI IRIX / X11 / Motif style)
- InGen corporate control-room terminals
- security dashboards and system monitors from JP1–JP3

The aesthetic is a core thematic requirement.

---

### 2.3.1. Aspect Ratio Enforcement

- The entire game renders inside a fixed **4:3 frame**, matching 1990s workstation displays.
- No UI element may extend beyond the 4:3 safe area.
- On wider displays, pillarboxing MUST be used.

---

### 2.3.2. Pixel Rendering Rules

- All rendering MUST use **nearest‑neighbor** scaling.
- No anti‑aliasing, smoothing, interpolation, or subpixel rendering.
- All UI elements MUST appear crisp and pixel-aligned, similar to 1990s SGI terminals.

---

### 2.3.3. Color Palette Rules (InGen Control-Room Palette)

The UI MUST use a restricted palette inspired by Jurassic Park’s system monitors:

- **Neon Green (#00FF66)** — nominal system state
- **Amber Yellow (#FFCC33)** — warnings
- **Orange (#FF8800)** — danger
- **Red (#FF4444)** — critical failures
- **Cyan (#00CCFF)** — system information
- **Black / Deep Gray** — background surfaces

Rules:

- Colors MUST NOT be repurposed.
- No gradients, no soft shadows, no modern UI effects.

---

### 2.3.4. Typography Rules (Jurassic Park Terminal Style)

- Only monospaced fonts allowed.
- Fonts MUST resemble 1990s terminal fonts.
- Recommended:
  - **IBM Plex Mono**
  - **Cascadia Mono**
  - **JetBrains Mono**
- No proportional fonts.
- No font smoothing (must appear pixel-sharp).

---

### 2.3.5. CRT / Workstation Simulation Layer

The game MUST apply subtle effects to emulate 1990s control-room displays:

- faint horizontal scanlines (1–2 px spacing)
- slight luminance flicker (0.5–1% intensity)
- minimal chromatic aberration on bright edges
- subtle vignette darkening
- occasional signal noise during storms

Effects MUST NOT reduce readability.

---

### 2.3.6. UI Motion & Animation Rules

Animations MUST be minimal and functional, matching JP control-room behavior.

Allowed:

- instant window pop-in (Motif style)
- alert pulsing (≤1 Hz)
- glitch effects during telemetry corruption
- camera feed static bursts

Forbidden:

- smooth transitions
- easing curves
- particle effects
- 3D transforms
- modern UI animations

---

### 2.3.7. Iconography Rules (InGen Style)

Icons MUST:

- be simple geometric shapes
- use 1–2 bit color depth
- resemble 1990s security system icons
- remain readable at 16×16 px
- avoid gradients or soft shadows

Examples:

- triangles for warnings
- squares for system modules
- circles for sensors
- simple line-art silhouettes for dinosaurs

---

### 2.3.8. Layout Density Rules

- Panels MUST NOT overlap.
- Panels MUST maintain fixed padding and margins.
- Information density MUST be high, similar to JP control dashboards.
- No decorative empty space.
- The UI MUST feel like a busy operations console.

---

### 2.3.9. Error & Corruption Visual Language (JP-style)

During telemetry corruption:

- values may flicker between states
- UI elements may jitter by 1–2 px
- camera feeds may freeze or show static
- corrupted values MUST be visually distinct (e.g., magenta “###”)
- occasional “terminal snow” effect allowed

This MUST evoke the chaotic system failures seen in the films.

---

### 2.3.10. Accessibility Constraints

- No colorblind modes (retro authenticity)
- No UI scaling beyond integer scaling
- No alternate themes
- No modern accessibility overlays

These constraints are intentional and part of the Jurassic Park OS fantasy.

---

## 2.4. Technology Stack Specification

The game MUST be implemented using a strictly defined and limited technology stack to ensure determinism, maintainability, and consistent retro-OS presentation.

This section defines the allowed technologies, their roles, and the constraints under which they may be used.

---

### 2.4.1. Frontend Framework

The primary UI framework MUST be:

- **Angular (v17+)**
- Standalone component architecture
- Strict TypeScript mode enabled
- ChangeDetectionStrategy.OnPush recommended for all components

Angular is responsible for:

- OS desktop simulation
- window manager
- UI panels and dashboards
- terminal interface
- event log rendering
- camera feed display
- user input handling
- state visualization (never mutation)

Angular MUST NOT:

- run simulation logic
- contain randomness
- mutate game state directly
- bypass tick-based updates

---

### 2.4.2. Rendering Layer

The primary rendering layer MUST be:

- **HTML5 Canvas (2D context)**
- OR **PixiJS** (if batching/performance required)

Canvas/Pixi is responsible for:

- zone map rendering
- camera feed compositing
- glitch/static effects
- CRT overlay
- scanline rendering
- icon rendering

Canvas/Pixi MUST NOT:

- run physics
- run 3D rendering
- run simulation logic
- bypass Angular’s UI flow

---

### 2.4.3. Optional 3D Layer (Babylon.js)

Babylon.js MAY be included in the project, but:

- It MUST NOT be used for core gameplay.
- It MUST NOT render 3D dinosaurs, 3D environments, or 3D physics.
- It MAY ONLY be used for:
  - optional non-interactive background scenes
  - intro/outro cinematic sequences
  - decorative rotating InGen logo
  - stylized 3D “system boot” animation

Babylon.js MUST NEVER:

- influence gameplay
- display real-time simulation data
- replace the 2D OS interface

If Babylon.js is not needed, it SHOULD remain unused.

---

### 2.4.4. Simulation Engine

The simulation MUST be implemented as:

- a pure TypeScript module
- no external dependencies
- deterministic, tick-based
- single global RNG stream

Simulation code MUST:

- run outside Angular
- expose immutable snapshots
- never depend on rendering or UI timing
- never use async timers (only tick progression)

---

### 2.4.5. State Management

State MUST be handled using:

- a single global **SimulationState** object
- immutable snapshots per tick
- Angular receives read-only state

Allowed patterns:

- RxJS BehaviorSubject for snapshot streaming
- Signals (Angular 17+) for UI binding

Forbidden:

- mutable shared objects
- two-way binding
- UI-driven state mutation

---

### 2.4.6. Camera Feed Implementation

Camera feeds MUST be simulated, not real video.

Allowed formats:

- **pre-rendered GIF loops**
- **sprite sheets**
- **WebP animated images**
- **Canvas-rendered static frames**
- **procedural noise/static overlays**

Camera feeds MUST:

- update only on tick boundaries
- support corruption states (freeze, static, delay)
- never exceed 4–8 FPS (retro aesthetic)
- never use real-time video decoding

GIF usage rules:

- GIFs MUST be short (1–3 seconds)
- MUST loop seamlessly
- MUST be low color depth (≤ 64 colors)
- MUST be pixelated (nearest-neighbor)

---

### 2.4.7. Audio System

Allowed technologies:

- WebAudio API
- OGG or WAV files
- max 4 simultaneous channels

Audio MUST be:

- short
- synthetic
- retro-styled (beeps, static, alarms)

Forbidden:

- positional audio
- 3D audio
- high-fidelity soundscapes

---

### 2.4.8. Storage & Persistence

Save system MUST use:

- JSON serialization
- browser localStorage or IndexedDB

Save files MUST contain:

- full simulation state
- RNG seed
- active events
- cooldown timers
- escalation phase

Forbidden:

- binary formats
- compression
- external cloud sync

---

### 2.4.9. Networking

The game MUST be fully offline.

Forbidden:

- multiplayer
- online services
- remote APIs
- telemetry upload

---

### 2.4.10. Performance Constraints

The game MUST run at:

- 60 FPS UI rendering
- 0.5 Hz simulation tick (1 tick = 2 seconds)

Memory usage target:

- < 300 MB total
- < 50 MB textures

---

### 2.4.11. Browser Compatibility

Minimum supported browsers:

- Chromium-based browsers (Chrome, Edge)
- Firefox (latest)
- Safari (latest)

The game MUST NOT rely on:

- WebGPU
- experimental APIs
- vendor-specific features

---

# 3. Core Game Loop

## 3.1. Tick System

The game uses a fixed deterministic tick system.

### Tick Definition

- 1 tick = 2.0 seconds realtime
- all simulation updates occur only on tick boundaries
- no partial updates between ticks

---

## 3.2. Strict Update Order

Every tick MUST execute in this exact order:

1. Weather update
2. Power grid update
3. Fence update
4. Dinosaur AI update
5. Logistics update
6. Staff update
7. Event generation
8. Consequence propagation
9. UI refresh
10. Audio alerts

The update order MUST NEVER change.

---

# 4. World Configuration

## 4.1. Fixed World State

The park contains exactly:

- 6 zones
- 12 fences
- 3 generators
- 9 security cameras
- 2 maintenance teams
- 1 helicopter
- 18 dinosaurs

These counts are fixed.

---

## 4.2. Zones

Zones:

1. Herbivore North
2. Herbivore South
3. Predator East
4. Predator West
5. Research Sector
6. Visitor Sector

Each zone contains:

- 2 fences
- 1–3 dinosaurs
- 1–2 cameras

---

# 5. Gameplay Pressure Systems

## 5.1. Core Gameplay Pillars

The gameplay MUST constantly create:

- prioritization pressure
- delayed consequences
- partial information
- cascading failures
- resource starvation
- information overload
- simultaneous emergencies
- operator cognitive overload

The player should NEVER feel fully in control.

---

## 5.2. Delayed Consequences

Most player actions must create:

- immediate benefit
- delayed drawback

Example:

- increasing fence voltage reduces fence stress
- but increases generator heat and fuel usage

The game MUST avoid simple one-click solutions.

---

## 5.3. False Stability

The UI MUST sometimes present outdated or corrupted information.

The player must occasionally:

- believe systems are stable
- while hidden instability increases internally

This is mandatory for gameplay tension.

---

## 5.4. Ghost Alerts (Added)

The system may generate:

- false positives
- stuck sensor values
- outdated telemetry

Players must cross‑verify data (camera vs. sensor vs. logs).

---

# 6. Numerical Systems

## 6.1. Fence System

Each fence contains:

- voltage (0–100)
- integrity (0–100)
- stress (0–100)

### Passive Degradation

Every 5 ticks:

- integrity -= 1

### Storm Modifier

During storm:

- stress += 3 per tick

### Aggression Modifier

If dinosaur aggression > 70:

- stress += 2 per tick

### Fence Testing State

If dinosaur enters Fence Testing:

- stress += 5 per tick

### Fence Failure

If:

- integrity <= 0  
  OR
- stress >= 100

THEN:

- trigger fence breach

---

## 6.2. Fence States

Fences may exist in:

- Stable
- Unstable
- Sparking
- Intermittent
- Breached

State transitions are automatic.

---

# 7. Power Grid System

## 7.1. Generators

Each generator contains:

- fuel (0–100)
- load (0–100)
- temperature (0–100)

### Fuel Consumption

Per tick:

- fuel -= load × 0.02

### Heat Increase

If load > 80:

- temperature += 2 per tick

### Cooling

If load < 40:

- temperature -= 1 per tick

### Overheating

If temperature > 85:

- 5% overheating chance per tick

### Blackout Rule

If 2 generators offline simultaneously:

- trigger global blackout

---

## 7.2. Power Allocation System (Added)

Players may reroute power between:

- fences
- cameras
- logistics lighting
- sensor grid

Tradeoffs:

- reducing camera power increases blind spots
- reducing fence power increases breach risk
- reducing logistics power slows staff movement

---

# 8. Dinosaur AI

## 8.1. AI Architecture

Deterministic finite state machines.

States:

- Idle
- Roaming
- Agitated
- Hunting
- Fence Testing

---

## 8.2. Hidden Variables

Each dinosaur contains hidden:

- intelligence
- aggression
- escalation tendency
- pattern recognition (Added)

These MUST NOT be shown directly.

---

## 8.3. State Transitions

### Idle → Roaming

- 20% chance every 10 ticks

### Roaming → Agitated

If stress > 60

### Agitated → Fence Testing

If aggression > 70

### Hunting State

If chaos event nearby OR stress > 80

---

## 8.4. Pattern Recognition (Added)

If a fence remains low‑voltage for > 10 ticks:

- dinosaur “learns” weakness
- increases probability of targeting that fence

---

# 9. Event System

## 9.1. Event Queue

Max simultaneous events: 8  
Events expire after 30 ticks unless resolved.

---

## 9.2. Event Categories

Minor:

- camera offline
- fence voltage drop
- dinosaur stress increase

Major:

- generator overheating
- high fence stress
- approaching storm

Critical:

- fence breach
- dinosaur escape
- total blackout

---

## 9.3. Event Probabilities

Minor: 12% per tick  
Major: 4% per tick  
Critical: 1% per tick

---

## 9.4. Dynamic Escalation

Every 15 minutes:

- minor +1%
- major +0.5%
- critical +0.25%

Caps:

- minor 35%
- major 15%
- critical 8%

---

# 10. Escalation Phases

Phase 1 – Routine (0–10 min)  
Phase 2 – Strain (10–25 min)  
Phase 3 – Breakdown (25–45 min)  
Phase 4 – Catastrophe (45+ min)

---

# 11. Failure Cascade System

## 11.1. Dependency Graph

### Blackout Effects

- disables 50% cameras
- reduces fence voltage by 40%
- increases dinosaur stress by 10

### Camera Failure Effects

If >50% cameras offline:

- aggression increases 2×
- event detection delayed by 3 ticks

### Supply Shortage

If tranquilizer ammo == 0:

- helicopter disabled

### Staff Exhaustion Effects

If fatigue > 75:

- action duration +50%
- repair failure chance +15%

---

## 11.2. Staff Morale & Panic (Added)

If stability < 40:

- staff may refuse dangerous assignments
- staff may abort mid‑task
- staff presence near fences increases dinosaur agitation

---

# 12. Information Corruption System

## 12.1. Telemetry Corruption

During storms:

- camera freeze
- delayed logs
- fluctuating fence readings

---

## 12.2. Camera States

- Online
- Delayed
- Interference
- Corrupted
- Offline

---

## 12.3. Ghost Alerts (Added)

System may generate:

- false fence drops
- false camera offline alerts
- stuck sensor values

Players must cross‑verify.

---

# 13. Player Actions

Every action has:

- cooldown
- execution delay
- resource cost
- risk factor

Actions MUST NOT resolve instantly.

---

## 13.1. Example Actions

Reset Fence  
Increase Voltage  
Dispatch Patrol  
Generator Restart

---

## 13.2. Protocol Overrides (Added)

High‑risk emergency actions:

### Emergency Venting

- instantly cools generators
- causes 5‑tick blackout in adjacent zones

### Lethal Authorization

- reduces dinosaur threat
- −20 stability penalty

### System Hard Reboot

- clears all errors
- disables entire park for 10 ticks

---

# 14. Resource Economy

Fuel  
Tranquilizer ammo  
Spare parts  
Medical supplies

---

## 14.1. Logistics Travel Time (Added)

Helicopter and teams have:

- physical location
- travel time between zones
- storm delay modifiers

---

# 15. Operator Overload Systems

## 15.1. Alert Fatigue

If >5 active alerts:

- UI clutter increases
- response efficiency decreases

---

## 15.2. Operator Stress

If 3+ critical events:

- UI glitches intensify
- notification delays increase
- telemetry corruption increases

---

## 15.3. Audio Overload (Added)

During high stress:

- overlapping radio chatter
- multiple alarms
- distorted audio

---

## 15.4. Terminal Lag (Added)

High system load may cause:

- delayed terminal input
- character corruption

---

# 16. Stability System

Formula unchanged.

---

# 17. UI Layout

Left Panel: alerts  
Center Panel: map + cameras  
Right Panel: logs + actions  
Bottom Dock: apps

Fixed layout.

---

# 18. Audio Rules

Max 4 simultaneous sounds.  
Critical overrides others.

---

# 19. Terminal System

Commands:

- status
- fence reset [ID]
- cam reboot [ID]
- dino track [ID]
- power reroute [ZONE]

---

# 20. Save System

Autosave every 60 ticks.  
JSON only.

---

# 21. Loss Conditions

- stability == 0
- 3 fence breaches
- visitor sector compromised > 20 ticks
- blackout > 30 ticks

---

# 22. LLM Hard Constraints

The LLM MUST NOT:

- invent new systems
- invent new dinosaurs
- invent new UI panels
- change numerical formulas
- change update order
- add multiplayer
- add crafting
- add building placement
- add weapons
- add combat mechanics
- add skill trees
- add quests
- override deterministic simulation rules
- introduce randomness outside defined probability systems
- create new event categories or event types
- modify escalation phases or their timing
- bypass cooldown, delay, or cost systems
- skip or reorder tick execution steps

---

# 23. Determinism Requirements

The simulation MUST be fully deterministic given:

- initial world state
- RNG seed
- player action sequence

## 23.1. RNG Rules

All randomness MUST:

- use a single global seeded RNG stream
- be consumed only in Event System and AI state transitions
- never be called directly from UI logic

## 23.2. Replay Guarantee

Given identical inputs:

- identical tick progression MUST occur
- identical event sequence MUST occur
- identical failure cascades MUST occur

---

# 24. Simulation Integrity Rules

## 24.1. Single Source of Truth

Each system state MUST be stored in:

- centralized simulation state object

No duplicated state is allowed across systems.

---

## 24.2. State Mutation Rules

State changes MUST only occur:

- inside tick update phases
- inside event resolution phase
- inside player action resolution phase

UI layer MUST NEVER mutate game state directly.

---

## 24.3. Immutable Snapshot Principle

At the start of each tick:

- a snapshot of the current state is created

All calculations for that tick MUST use:

- only snapshot data
- no mid-tick mutation reads

---

# 25. Event Resolution Rules

## 25.1. Event Priority Order

Within each tick, events resolve in this order:

1. Critical events
2. Major events
3. Minor events

---

## 25.2. Event Conflict Resolution

If multiple events target the same system:

- Critical overrides Major and Minor
- Major overrides Minor only if resource contention exists
- Otherwise effects are merged additively

---

## 25.3. Event Saturation

If active events > 8:

- excess events are queued (not discarded)
- queued events have delayed execution (1–5 ticks random delay within defined RNG system)

---

# 26. System Interaction Rules

## 26.1. Cross-System Dependency Enforcement

The following dependencies MUST ALWAYS apply:

- Power system affects:
  - fences
  - cameras
  - logistics

- Dinosaur system affects:
  - fences
  - zone stability
  - event generation frequency

- Weather system affects:
  - power stability
  - sensor accuracy
  - dinosaur aggression modifiers

---

## 26.2. Chain Reaction Enforcement

Any system failure MUST be allowed to propagate.

Examples:

Fence breach →

- dinosaur escape possibility increases
- visitor sector risk increases
- emergency events triggered

Blackout →

- camera degradation
- fence instability increase
- AI uncertainty increase

---

# 27. Player Action System Rules

## 27.1. Action Queue System

Player actions MUST be:

- queued
- delayed
- executed in order

No action is instantaneous unless explicitly defined.

---

## 27.2. Action Interruption Rules

Actions MAY be interrupted by:

- Critical events
- Blackouts
- Staff unavailability
- System corruption

If interrupted:

- partial effects MAY still apply
- cooldown is always consumed

---

## 27.3. Action Cost Enforcement

If resources are insufficient:

- action MUST fail
- partial execution is not allowed unless explicitly defined
- cooldown still applies

---

# 28. UI Information Design Rules

## 28.1. Imperfect Information Principle

The UI MUST NOT display:

- exact dinosaur intent
- exact hidden aggression values
- exact failure probabilities
- full system internal state

Only derived indicators are allowed.

---

## 28.2. Derived Metrics Only

UI may display:

- stability index
- alert severity
- system health categories
- trend indicators (increasing/decreasing/stable)

NOT raw simulation variables.

---

## 28.3. Temporal Delay Rules

Some UI updates MUST be delayed:

- camera feeds: up to 3 tick delay
- logs: up to 1 tick delay
- sensor data: up to 2 tick jitter

---

# 29. Difficulty Scaling System

## 29.1. Time-Based Escalation

Every real-time interval increases baseline instability:

- Minor events: + scaling factor
- Major events: + smaller scaling factor
- Critical events: + smallest scaling factor

Scaling MUST be smooth, not abrupt.

---

## 29.2. System Strain Amplification

As stability decreases:

- event frequency increases
- system recovery efficiency decreases
- failure propagation speed increases
- UI corruption likelihood increases

This creates a positive feedback loop toward collapse.

---

# 30. End-State Logic

## 30.1. No Win Condition

The game has no victory state.

Only outcomes:

- continued survival
- system collapse

---

## 30.2. Collapse Definition

Collapse occurs when:

- Stability reaches 0
  OR
- multiple simultaneous systemic failures exceed recovery threshold

---

## 30.3. Collapse Behavior

During collapse phase:

- event frequency spikes to maximum allowed caps
- all systems degrade simultaneously
- player actions become partially ineffective
- UI reliability decreases significantly

---

# 31. Final Design Constraint Summary

The system MUST always ensure:

- systemic interdependency
- cascading failure potential
- imperfect information
- delayed consequence loops
- resource tension
- escalating pressure phases
- deterministic simulation behavior

---

# Final Experience Goal

The game MUST simulate:

> controlled operational collapse under increasing cognitive load, imperfect information, and escalating systemic pressure.
