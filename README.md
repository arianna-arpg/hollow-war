# Hollow War

A theorycrafting-first **Vampire Survivors / Nova Drift** arena roguelite built on **Hollow Wake** combat principles.

**Website:** https://arianna-arpg.github.io/hollow-war/

**Play in browser:** https://arianna-arpg.github.io/hollow-war/play/

## Highlights
- **Hollow Wake Classes & Ultimates**: Deploy as the *Magician*, *Warrior*, *Rogue*, *Necromancer*, *Pyromancer*, or *Guardian*—each with a distinct class silhouette and active Ultimate (`[Space]` / `[Shift]`).
- **Arts & Inscriptions**: Equip up to **4 active Arts** (up to Rank 8), including projectiles, sweeps, novas, chains, orbiting hammers, **Minions** (*Raise Skeleton*, *Bind Flame Sprite*), **Storm Totems**, and **Cinder Traps**. Etch up to **2 Inscriptions** onto compatible Arts.
- **Emergent Combat SDK** (`src/sdk/`): Tag-scoped `StatSheet` (`flat` / `inc` / `more`), `when` conditions, Elemental Conversions, Gain-as-Extra damage, 5 ailments (`ignite`, `bleed`, `poison`, `chill`, `shock`), and ICD-guarded `ProcRuntime` chains.
- **Demon & Undead Hosts**: Fight across the Ashen Warfront against Risen Ghouls, Skeletons, Wraiths, Imps, Hellhounds, Demon Brutes, Marrow Liches, and Abyssal Demon Lords.
- **Live Theorycrafting**: Level-up drafts fork your `StatSheet` to preview exact **Est. DPS %** deltas, and `[Tab]` opens the full Build & Arts Inspector.

## Development

```bash
npm install
npm run dev
```

Tests and production build:

```bash
npm test
npm run build
```

## Roadmap
- Cross-game Hollow Wake progression & shared unlocks (titles, wardrobe aesthetics, and relic synergies).
