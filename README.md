# Hollow War

**Hollow War** is a theorycrafting-first **Vampire Survivors / Nova Drift** arena roguelite inspired by **Hollow Wake** and its portable Combat SDK (`@hollow-wake/engine`).

## Core Features
- **Tag-Scoped `StatSheet` Engine** (`src/sdk/stat-sheet.ts`): Evaluates `(base + flat) * (1 + inc) * prod(1 + more)` with skill-tag filtering (`projectile`, `aoe`, `orbit`, `chain`, `fire`, `chaos`, etc.) and live actor `when` conditions (`lowLife`, `fullLife`, `warded`, `moving`, `stationary`).
- **Conversions, Gain-as-Extra & Ailments** (`src/sdk/combat-resolver.ts`): Full multi-elemental pipeline supporting Physical/Elemental conversions, Gain % as Extra Chaos, Armor/Resistance penetration, and 5 ailments (`ignite`, `bleed`, `poison`, `chill`, `shock`).
- **Emergent Proc Chains** (`src/sdk/proc-runtime.ts`): `onHit`, `onCrit`, `onKill`, `onDash`, and `onWardBreak` procs with internal cooldowns (ICD) and recursion depth guards.
- **Socketable Support Gems & Keystones**: Customize active skills with Support Sockets (*Split Volley*, *Combustion*, *Spell Echo*, *Void Infusion*) and Nova Drift-style Keystones (*Glass Cannon*, *Crimson Pact*, *Pyromania*, *Static Overload*, *Singularity*).
- **Live Theorycrafting Previews**: Level-up draft cards fork your `StatSheet` to show exact **Est. DPS %** deltas before you pick, and `[Tab]` opens the full **Build & Stats Inspector**.

## Quick Start

```bash
npm install
npm run dev
```

Run tests and type-checking:

```bash
npm test
npm run build
```
