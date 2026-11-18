import type { SkillDamageSpec } from '../sdk/combat-resolver.ts';
import type { ConversionRule, ExtraDamageRule, Modifier, SkillTag } from '../sdk/types.ts';

export const MAX_ACTIVE_ARTS = 4;
export const MAX_ART_RANK = 8;
export const MAX_INSCRIPTIONS_PER_ART = 2;

export type ArtBehavior =
  | 'projectile'
  | 'projectile_nova'
  | 'spiral'
  | 'chain'
  | 'orbit'
  | 'nova'
  | 'ground_zone'
  | 'sweep'
  | 'minion'
  | 'totem'
  | 'trap';

export interface ArtDefinition extends SkillDamageSpec {
  id: string;
  name: string;
  description: string;
  color: string;
  behavior: ArtBehavior;
  baseProjectiles: number;
  baseRadius: number;
  projectileSpeed?: number;
  baseChain?: number;
  basePierce?: number;
  homing?: boolean;
  explodeRadius?: number;
  explodeScale?: number;
  tags: readonly SkillTag[];
}

export interface InscriptionDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  requiredTags?: readonly SkillTag[];
  mods: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  echoChance?: number;
}

export const ARTS: Record<string, ArtDefinition> = {
  firebolt: {
    id: 'firebolt',
    name: 'Firebolt',
    description:
      'Looses a lance of condensed cinder that streaks across the ash and sets struck flesh alight.',
    color: '#f97316',
    behavior: 'projectile',
    baseDamage: { fire: 22, physical: 6 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.6,
    baseCritChance: 0.02,
    baseProjectiles: 1,
    baseRadius: 7,
    projectileSpeed: 550,
    tags: ['spell', 'projectile', 'fire'],
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description:
      'Hurls a heavy sphere of condensed flame that detonates on impact, scorching clustered foes in a fiery blast.',
    color: '#ea580c',
    behavior: 'projectile',
    baseDamage: { fire: 28 },
    damageEffectiveness: 1.2,
    baseCooldown: 0.82,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 10,
    projectileSpeed: 460,
    explodeRadius: 82,
    explodeScale: 0.75,
    tags: ['spell', 'projectile', 'aoe', 'fire'],
  },
  flame_arrow: {
    id: 'flame_arrow',
    name: 'Flame Arrow',
    description:
      'Fires a flaming arrow that pierces up to 2 enemies and kindles fierce ignites.',
    color: '#ff9646',
    behavior: 'projectile',
    baseDamage: { fire: 22, physical: 8 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.56,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 5,
    projectileSpeed: 620,
    basePierce: 2,
    tags: ['spell', 'projectile', 'fire'],
  },
  frostbolt: {
    id: 'frostbolt',
    name: 'Frostbolt',
    description:
      'Conjures a razor shard of winter-glass that chills targets and flies swiftly across the barrow.',
    color: '#38bdf8',
    behavior: 'projectile',
    baseDamage: { cold: 23 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.56,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 6,
    projectileSpeed: 610,
    tags: ['spell', 'projectile', 'cold'],
  },
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    description:
      'Sweeps a heavy iron arc before you, carving through clustered foes and leaving deep, bleeding wounds.',
    color: '#d8b06a',
    behavior: 'sweep',
    baseDamage: { physical: 30 },
    damageEffectiveness: 1.2,
    baseCooldown: 0.72,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 118,
    tags: ['attack', 'aoe', 'physical'],
  },
  rend: {
    id: 'rend',
    name: 'Rend',
    description:
      'Whips a rapid twin-edged slash in front of you, opening jagged arteries with high critical precision.',
    color: '#f43f5e',
    behavior: 'sweep',
    baseDamage: { physical: 22 },
    damageEffectiveness: 0.95,
    baseCooldown: 0.48,
    baseCritChance: 0.1,
    baseProjectiles: 1,
    baseRadius: 96,
    tags: ['attack', 'aoe', 'physical'],
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    description:
      'Spins a tempest of steel around your vessel, battering every foe within reach.',
    color: '#e2e8f0',
    behavior: 'nova',
    baseDamage: { physical: 25 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.92,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 126,
    tags: ['attack', 'aoe', 'nova', 'physical'],
  },
  fan_of_blades: {
    id: 'fan_of_blades',
    name: 'Fan of Blades',
    description:
      'Throws a fan of 5 tempered knives in a wide frontal arc.',
    color: '#c0c8d8',
    behavior: 'projectile',
    baseDamage: { physical: 13 },
    damageEffectiveness: 0.7,
    baseCooldown: 0.68,
    baseCritChance: 0.08,
    baseProjectiles: 5,
    baseRadius: 5.5,
    projectileSpeed: 540,
    tags: ['attack', 'projectile', 'physical'],
  },
  sacrament_of_ruin: {
    id: 'sacrament_of_ruin',
    name: 'Sacrament of Ruin',
    description:
      'Launches 3 homing chaos orbs that curve toward foes and burst in an explosive chaos splash on impact.',
    color: '#c058c8',
    behavior: 'projectile',
    baseDamage: { chaos: 18 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.78,
    baseCritChance: 0.04,
    baseProjectiles: 3,
    baseRadius: 8,
    projectileSpeed: 400,
    homing: true,
    explodeRadius: 76,
    explodeScale: 0.72,
    tags: ['spell', 'projectile', 'aoe', 'chaos'],
  },
  poison_nova: {
    id: 'poison_nova',
    name: 'Poison Nova',
    description:
      'Releases a ring of 16 slow venom bolts outward in all directions, inflicting potent Chaos Poison.',
    color: '#66c83c',
    behavior: 'projectile_nova',
    baseDamage: { chaos: 14 },
    damageEffectiveness: 0.85,
    baseCooldown: 1.35,
    baseCritChance: 0.03,
    baseProjectiles: 16,
    baseRadius: 6,
    projectileSpeed: 310,
    tags: ['spell', 'projectile', 'aoe', 'chaos'],
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description:
      'Calls down a jagged arc that leaps from host to host, leaving every struck foe shocked and brittle.',
    color: '#38bdf8',
    behavior: 'chain',
    baseDamage: { lightning: 24 },
    damageEffectiveness: 0.9,
    baseCooldown: 0.76,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 215,
    baseChain: 3,
    tags: ['spell', 'chain', 'lightning'],
  },
  hammer_of_judgment: {
    id: 'hammer_of_judgment',
    name: 'Hammer of Judgment',
    description:
      'Hurls spectral war-hammers that spiral outward around you, repeatedly crushing enemies in their path.',
    color: '#e8c878',
    behavior: 'spiral',
    baseDamage: { physical: 22 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.95,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 11,
    projectileSpeed: 280,
    basePierce: 99,
    tags: ['spell', 'projectile', 'physical'],
  },
  consecration: {
    id: 'consecration',
    name: 'Consecration',
    description:
      'Consecrates the ground for 4.5s, scorching enemies inside while healing you as you stand upon it.',
    color: '#f0d890',
    behavior: 'ground_zone',
    baseDamage: { fire: 16 },
    damageEffectiveness: 0.9,
    baseCooldown: 4.8,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 125,
    tags: ['spell', 'aoe', 'fire'],
  },
  frost_nova: {
    id: 'frost_nova',
    name: 'Frost Nova',
    description:
      'Shatters the air in a ring of hoarfrost, chilling and slowing the advancing tide.',
    color: '#67e8f9',
    behavior: 'nova',
    baseDamage: { cold: 26 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.38,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 152,
    tags: ['spell', 'aoe', 'nova', 'cold'],
  },
  summon_skeleton: {
    id: 'summon_skeleton',
    name: 'Summon Skeleton Warrior',
    description:
      'Summons bound Skeletal Warriors from the barrow to hunt nearby foes with iron blades.',
    color: '#cfc8b8',
    behavior: 'minion',
    baseDamage: { physical: 20 },
    damageEffectiveness: 0.9,
    baseCooldown: 0.85,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 14,
    tags: ['spell', 'minion', 'physical'],
  },
  summon_flame_sprite: {
    id: 'summon_flame_sprite',
    name: 'Summon Flame Sprite',
    description:
      'Summons living Flame Sprites that hover beside you and cast Firebolts at nearby enemies.',
    color: '#ffb05a',
    behavior: 'minion',
    baseDamage: { fire: 18 },
    damageEffectiveness: 0.85,
    baseCooldown: 0.78,
    baseCritChance: 0.04,
    baseProjectiles: 2,
    baseRadius: 10,
    projectileSpeed: 480,
    tags: ['spell', 'minion', 'projectile', 'fire'],
  },
  ballista_sentry: {
    id: 'ballista_sentry',
    name: 'Ballista Sentry',
    description:
      'Plants an iron-framed ballista totem that fires piercing bolts at approaching foes.',
    color: '#c8b890',
    behavior: 'totem',
    baseDamage: { physical: 24 },
    damageEffectiveness: 1.0,
    baseCooldown: 3.4,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 240,
    projectileSpeed: 620,
    basePierce: 2,
    tags: ['attack', 'totem', 'projectile', 'physical'],
  },
  fire_mine: {
    id: 'fire_mine',
    name: 'Fire Mine',
    description:
      'Arms volatile ember mines underfoot that detonate in an Immolation Blast when demons or undead step near.',
    color: '#e8624a',
    behavior: 'trap',
    baseDamage: { fire: 36, physical: 10 },
    damageEffectiveness: 1.25,
    baseCooldown: 1.45,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 105,
    tags: ['spell', 'trap', 'aoe', 'fire'],
  },
  flame_totem: {
    id: 'flame_totem',
    name: 'Flame Totem',
    description:
      'Plants a destructible ember totem that rapidly fires Firebolts at nearby enemies.',
    color: '#e8824a',
    behavior: 'totem',
    baseDamage: { fire: 20 },
    damageEffectiveness: 0.9,
    baseCooldown: 3.6,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 220,
    projectileSpeed: 520,
    tags: ['spell', 'totem', 'projectile', 'fire'],
  },
  summon_bone_golem: {
    id: 'summon_bone_golem',
    name: 'Summon Bone Golem',
    description:
      'Summons a towering Bone Golem that charges packs and shatters the ground with seismic slams.',
    color: '#d8d0c0',
    behavior: 'minion',
    baseDamage: { physical: 34 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.25,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 72,
    tags: ['spell', 'minion', 'aoe', 'physical'],
  },
  frost_trap: {
    id: 'frost_trap',
    name: 'Frost Trap',
    description:
      'Places a rune of biting hoarfrost that triggers a Frost Nova when an enemy steps near.',
    color: '#9ad4e8',
    behavior: 'trap',
    baseDamage: { cold: 34 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.4,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 118,
    tags: ['spell', 'trap', 'aoe', 'cold'],
  },
};

export const INSCRIPTIONS: Record<string, InscriptionDef> = {
  split_volley: {
    id: 'split_volley',
    name: 'Inscription of Split Volley',
    shortName: 'Split Volley',
    description: 'Etches a fractured flight path: +2 Projectiles, at the cost of 18% Less Projectile Damage.',
    color: '#fbbf24',
    requiredTags: ['projectile'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 2 },
      { stat: 'damage', kind: 'more', value: -0.18, tags: ['projectile'] },
    ],
  },
  combustion: {
    id: 'combustion',
    name: 'Inscription of Combustion',
    shortName: 'Combustion',
    description: 'Binds hungry cinder to the Art: +45% Ignite Chance, +25% More Fire Damage, +10% Fire Penetration, but -25% Critical Strike Multiplier.',
    color: '#f97316',
    mods: [
      { stat: 'igniteChance', kind: 'flat', value: 0.45 },
      { stat: 'fireDamage', kind: 'more', value: 0.25 },
      { stat: 'firePen', kind: 'flat', value: 0.1 },
      { stat: 'critMulti', kind: 'flat', value: -0.25 },
    ],
  },
  forking_arc: {
    id: 'forking_arc',
    name: 'Inscription of Forking Arc',
    shortName: 'Forking Arc',
    description: 'Coaxes the current to leap further: +2 Chain Count and +15% Lightning Penetration, but 15% Less Art Damage.',
    color: '#38bdf8',
    requiredTags: ['chain'],
    mods: [
      { stat: 'chainCount', kind: 'flat', value: 2 },
      { stat: 'lightningPen', kind: 'flat', value: 0.15 },
      { stat: 'damage', kind: 'more', value: -0.15 },
    ],
  },
  void_infusion: {
    id: 'void_infusion',
    name: 'Inscription of Void Infusion',
    shortName: 'Void Infusion',
    description: 'Bleeds abyssal ruin into every strike: gain 25% of Physical & Elemental Damage as Extra Chaos and +25% Poison Chance, but 12% Less Attack & Cast Speed.',
    color: '#c084fc',
    mods: [
      { stat: 'poisonChance', kind: 'flat', value: 0.25 },
      { stat: 'castSpeed', kind: 'more', value: -0.12 },
      { stat: 'attackSpeed', kind: 'more', value: -0.12 },
    ],
    extras: [
      { from: 'physical', to: 'chaos', ratio: 0.25 },
      { from: 'fire', to: 'chaos', ratio: 0.25 },
      { from: 'cold', to: 'chaos', ratio: 0.25 },
      { from: 'lightning', to: 'chaos', ratio: 0.25 },
    ],
  },
  concentrated_core: {
    id: 'concentrated_core',
    name: 'Inscription of Concentrated Core',
    shortName: 'Concentrated',
    description: 'Compresses the blast inward: +35% More Area Damage, -20% Area of Effect.',
    color: '#f43f5e',
    requiredTags: ['aoe'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.35, tags: ['aoe'] },
      { stat: 'area', kind: 'inc', value: -0.2 },
    ],
  },
  spell_echo: {
    id: 'spell_echo',
    name: 'Inscription of Spell Echo',
    shortName: 'Spell Echo',
    description: 'Unleashes a resonant doublecast (100% Echo), at the cost of 28% Less Cast Speed.',
    color: '#818cf8',
    requiredTags: ['spell'],
    mods: [{ stat: 'castSpeed', kind: 'more', value: -0.28 }],
    echoChance: 1.0,
  },
  crimson_leech: {
    id: 'crimson_leech',
    name: 'Inscription of Crimson Leech',
    shortName: 'Crimson Leech',
    description: 'Draws vitality from every wound: +4% Life Leech, +20% Bleed Chance, +18% More Damage on Full Life, but -20% Critical Strike Multiplier.',
    color: '#ef4444',
    mods: [
      { stat: 'lifeLeech', kind: 'flat', value: 0.04 },
      { stat: 'bleedChance', kind: 'flat', value: 0.2 },
      { stat: 'damage', kind: 'more', value: 0.18, when: 'fullLife' },
      { stat: 'critMulti', kind: 'flat', value: -0.2 },
    ],
  },
  ruthless_precision: {
    id: 'ruthless_precision',
    name: 'Inscription of Ruthless Precision',
    shortName: 'Precision',
    description: 'Sharpens the Art to a deliberate, lethal edge: +14% Base Crit Chance and +40% Crit Multiplier, but 15% Less Attack & Cast Speed.',
    color: '#fde047',
    mods: [
      { stat: 'critChance', kind: 'flat', value: 0.14 },
      { stat: 'critMulti', kind: 'flat', value: 0.4 },
      { stat: 'castSpeed', kind: 'more', value: -0.15 },
      { stat: 'attackSpeed', kind: 'more', value: -0.15 },
    ],
  },
  bound_legion: {
    id: 'bound_legion',
    name: 'Inscription of the Bound Legion',
    shortName: 'Bound Legion',
    description: 'Calls an extra construct to the host: +1 Minion and +25% More Minion Damage, but 15% Less Minion Speed.',
    color: '#e2e8f0',
    requiredTags: ['minion'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 1 },
      { stat: 'damage', kind: 'more', value: 0.25 },
      { stat: 'attackSpeed', kind: 'more', value: -0.15 },
      { stat: 'castSpeed', kind: 'more', value: -0.15 },
    ],
  },
  rapid_totems: {
    id: 'rapid_totems',
    name: 'Inscription of Rapid Pylons',
    shortName: 'Rapid Pylons',
    description: 'Overclocks the totem’s cadence: +45% More Cast Speed and +15% Area, at the cost of 18% Less Damage.',
    color: '#38bdf8',
    requiredTags: ['totem'],
    mods: [
      { stat: 'castSpeed', kind: 'more', value: 0.45 },
      { stat: 'area', kind: 'inc', value: 0.15 },
      { stat: 'damage', kind: 'more', value: -0.18 },
    ],
  },
  hair_trigger: {
    id: 'hair_trigger',
    name: 'Inscription of Hair-Trigger Sigils',
    shortName: 'Hair-Trigger',
    description: 'Widens and intensifies the snare: +30% More Trap Damage and +25% Area, but 22% Slower Arming Recovery.',
    color: '#fb7185',
    requiredTags: ['trap'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.3 },
      { stat: 'area', kind: 'inc', value: 0.25 },
      { stat: 'cooldownRecovery', kind: 'more', value: -0.22 },
    ],
  },
  piercing_flight: {
    id: 'piercing_flight',
    name: 'Inscription of Piercing Flight',
    shortName: 'Piercing',
    description: 'Drives projectiles straight through the throng: +2 Pierce Count and +20% Projectile Damage, but 12% Less Speed.',
    color: '#a3e635',
    requiredTags: ['projectile'],
    mods: [
      { stat: 'pierceCount', kind: 'flat', value: 2 },
      { stat: 'damage', kind: 'inc', value: 0.2 },
      { stat: 'castSpeed', kind: 'more', value: -0.12 },
      { stat: 'attackSpeed', kind: 'more', value: -0.12 },
    ],
  },
  hoarfrost_bind: {
    id: 'hoarfrost_bind',
    name: 'Inscription of Hoarfrost',
    shortName: 'Hoarfrost',
    description: 'Steeps the Art in winter: +40% Chill Chance, +25% More Cold Damage, +10% Cold Pen, but 15% Less Fire Damage.',
    color: '#67e8f9',
    mods: [
      { stat: 'chillChance', kind: 'flat', value: 0.4 },
      { stat: 'coldDamage', kind: 'more', value: 0.25 },
      { stat: 'coldPen', kind: 'flat', value: 0.1 },
      { stat: 'fireDamage', kind: 'more', value: -0.15 },
    ],
  },
  elemental_pen: {
    id: 'elemental_pen',
    name: 'Inscription of Elemental Ruin',
    shortName: 'Elem. Ruin',
    description: 'Carves away warded resistances: +18% Fire, Cold & Lightning Penetration, but 15% Less Physical & Chaos Damage.',
    color: '#fbbf24',
    mods: [
      { stat: 'firePen', kind: 'flat', value: 0.18 },
      { stat: 'coldPen', kind: 'flat', value: 0.18 },
      { stat: 'lightningPen', kind: 'flat', value: 0.18 },
      { stat: 'physicalDamage', kind: 'more', value: -0.15 },
      { stat: 'chaosDamage', kind: 'more', value: -0.15 },
    ],
  },
  unbound_reach: {
    id: 'unbound_reach',
    name: 'Inscription of Unbound Reach',
    shortName: 'Unbound Reach',
    description: 'Unspools the Art across the barrow: +40% Increased Area of Effect, at the cost of 15% Less Area Damage.',
    color: '#38bdf8',
    requiredTags: ['aoe'],
    mods: [
      { stat: 'area', kind: 'inc', value: 0.4 },
      { stat: 'damage', kind: 'more', value: -0.15, tags: ['aoe'] },
    ],
  },
  focused_ruin: {
    id: 'focused_ruin',
    name: 'Inscription of Focused Ruin',
    shortName: 'Focused Ruin',
    description: 'Narrows every bolt into a killing point: +32% More Projectile Damage, but -20% Area of Effect.',
    color: '#f59e0b',
    requiredTags: ['projectile'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.32, tags: ['projectile'] },
      { stat: 'area', kind: 'inc', value: -0.2 },
    ],
  },
};

export interface ArtRankStep {
  summary: string;
  mods: Modifier[];
}

/**
 * Returns the bespoke bonus granted when an Art advances to `rank` (2..8).
 * Balances moderate direct damage with speed, crit, ailments, penetration, area, cooldowns, and extra projectiles/minions.
 */
export function getArtRankStep(artId: string, rank: number): ArtRankStep {
  const r = rank;
  switch (artId) {
    case 'firebolt':
      if (r === 3 || r === 6) return { summary: '+1 Projectile, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 0) return { summary: '+12% Cast Speed, +15% Ignite Chance, +8% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.12 }, { stat: 'igniteChance', kind: 'flat', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.08 }] };
      return { summary: '+8% Fire Pen, +18% Crit Multi, +10% More Damage', mods: [{ stat: 'firePen', kind: 'flat', value: 0.08 }, { stat: 'critMulti', kind: 'flat', value: 0.18 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'fireball':
      if (r % 2 === 0) return { summary: '+18% Area of Effect, +12% Ignite Chance, +10% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.18 }, { stat: 'igniteChance', kind: 'flat', value: 0.12 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+8% Fire Pen, +8% Crit Chance, +10% More Damage', mods: [{ stat: 'firePen', kind: 'flat', value: 0.08 }, { stat: 'critChance', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'flame_arrow':
      if (r === 2 || r === 5) return { summary: '+1 Pierce, +12% Cast Speed, +8% More Damage', mods: [{ stat: 'pierceCount', kind: 'flat', value: 1 }, { stat: 'castSpeed', kind: 'inc', value: 0.12 }, { stat: 'damage', kind: 'more', value: 0.08 }] };
      if (r === 4 || r === 7) return { summary: '+1 Arrow, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+18% Ignite Chance, +8% Fire Pen, +10% More Damage', mods: [{ stat: 'igniteChance', kind: 'flat', value: 0.18 }, { stat: 'firePen', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'frostbolt':
      if (r === 2 || r === 5 || r === 8) return { summary: '+1 Shard, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 1) return { summary: '+20% Chill Chance, +8% Cold Pen, +10% More Damage', mods: [{ stat: 'chillChance', kind: 'flat', value: 0.2 }, { stat: 'coldPen', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+14% Cast Speed, +22% Crit Multi, +8% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.14 }, { stat: 'critMulti', kind: 'flat', value: 0.22 }, { stat: 'damage', kind: 'more', value: 0.08 }] };

    case 'cleave':
      if (r % 2 === 0) return { summary: '+16% Area of Effect, +15% Bleed Chance, +10% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.16 }, { stat: 'bleedChance', kind: 'flat', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+14% Attack Speed, +10% Armor Pen, +10% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.14 }, { stat: 'armorPen', kind: 'flat', value: 0.1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'rend':
      if (r % 2 === 0) return { summary: '+15% Bleed Chance, +22% Ailment/DoT Damage, +10% More Damage', mods: [{ stat: 'bleedChance', kind: 'flat', value: 0.15 }, { stat: 'dotDamage', kind: 'inc', value: 0.22 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+8% Crit Chance, +25% Crit Multi, +10% More Damage', mods: [{ stat: 'critChance', kind: 'flat', value: 0.08 }, { stat: 'critMulti', kind: 'flat', value: 0.25 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'whirlwind':
      if (r % 3 === 0) return { summary: '+3% Life Leech, +15% Area, +10% More Damage', mods: [{ stat: 'lifeLeech', kind: 'flat', value: 0.03 }, { stat: 'area', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 0) return { summary: '+16% Attack Speed, +10% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.16 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+10% Armor Pen, +15% Bleed Chance, +10% More Damage', mods: [{ stat: 'armorPen', kind: 'flat', value: 0.1 }, { stat: 'bleedChance', kind: 'flat', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'fan_of_blades':
      if (r === 2 || r === 5 || r === 8) return { summary: '+2 Knives, +8% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 2 }, { stat: 'damage', kind: 'more', value: 0.08 }] };
      if (r === 3 || r === 6) return { summary: '+1 Pierce, +8% Crit Chance, +10% More Damage', mods: [{ stat: 'pierceCount', kind: 'flat', value: 1 }, { stat: 'critChance', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+15% Attack Speed, +22% Crit Multi, +8% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.15 }, { stat: 'critMulti', kind: 'flat', value: 0.22 }, { stat: 'damage', kind: 'more', value: 0.08 }] };

    case 'sacrament_of_ruin':
      if (r === 3 || r === 6) return { summary: '+1 Homing Orb, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 0) return { summary: '+18% Blast Area, +8% Chaos Pen, +10% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.18 }, { stat: 'chaosPen', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+18% Poison Chance, +20% DoT Damage, +10% More Damage', mods: [{ stat: 'poisonChance', kind: 'flat', value: 0.18 }, { stat: 'dotDamage', kind: 'inc', value: 0.2 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'poison_nova':
      if (r === 2 || r === 5 || r === 8) return { summary: '+4 Venom Bolts, +8% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 4 }, { stat: 'damage', kind: 'more', value: 0.08 }] };
      if (r % 2 === 1) return { summary: '+22% Ailment/DoT Damage, +8% Chaos Pen, +10% More Damage', mods: [{ stat: 'dotDamage', kind: 'inc', value: 0.22 }, { stat: 'chaosPen', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+14% Cooldown Recovery, +1 Pierce, +8% More Damage', mods: [{ stat: 'cooldownRecovery', kind: 'inc', value: 0.14 }, { stat: 'pierceCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.08 }] };

    case 'chain_lightning':
      if (r % 2 === 0) return { summary: '+1 Chain, +10% More Damage', mods: [{ stat: 'chainCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+16% Shock Chance, +8% Lightning Pen, +12% Cast Speed', mods: [{ stat: 'shockChance', kind: 'flat', value: 0.16 }, { stat: 'lightningPen', kind: 'flat', value: 0.08 }, { stat: 'castSpeed', kind: 'inc', value: 0.12 }] };

    case 'hammer_of_judgment':
      if (r === 2 || r === 5 || r === 8) return { summary: '+1 Spiraling Hammer, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 1) return { summary: '+15% Cast Speed, +15% Area, +10% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.15 }, { stat: 'area', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+10% Armor Pen, +24% Crit Multi, +10% More Damage', mods: [{ stat: 'armorPen', kind: 'flat', value: 0.1 }, { stat: 'critMulti', kind: 'flat', value: 0.24 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'consecration':
      if (r % 2 === 0) return { summary: '+18% Cooldown Recovery, +16% Area, +10% More Damage', mods: [{ stat: 'cooldownRecovery', kind: 'inc', value: 0.18 }, { stat: 'area', kind: 'inc', value: 0.16 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+18% Ignite Chance, +8% Fire Pen, +12% More Damage', mods: [{ stat: 'igniteChance', kind: 'flat', value: 0.18 }, { stat: 'firePen', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.12 }] };

    case 'frost_nova':
      if (r % 2 === 0) return { summary: '+18% Area, +20% Chill Chance, +10% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.18 }, { stat: 'chillChance', kind: 'flat', value: 0.2 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+16% Cooldown Recovery, +8% Cold Pen, +22% Crit Multi', mods: [{ stat: 'cooldownRecovery', kind: 'inc', value: 0.16 }, { stat: 'coldPen', kind: 'flat', value: 0.08 }, { stat: 'critMulti', kind: 'flat', value: 0.22 }] };

    case 'summon_skeleton':
      if (r === 2 || r === 5 || r === 8) return { summary: '+1 Skeleton Warrior, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+15% Attack Speed, +10% Armor Pen, +10% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.15 }, { stat: 'armorPen', kind: 'flat', value: 0.1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'summon_flame_sprite':
      if (r === 2 || r === 5 || r === 8) return { summary: '+1 Flame Sprite, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+15% Cast Speed, +16% Ignite Chance, +8% Fire Pen', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.15 }, { stat: 'igniteChance', kind: 'flat', value: 0.16 }, { stat: 'firePen', kind: 'flat', value: 0.08 }] };

    case 'summon_bone_golem':
      if (r === 5) return { summary: '+1 Bone Golem, +12% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      if (r % 2 === 0) return { summary: '+20% Slam Area, +12% Armor Pen, +12% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.2 }, { stat: 'armorPen', kind: 'flat', value: 0.12 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      return { summary: '+16% Attack Speed, +24% Crit Multi, +12% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.16 }, { stat: 'critMulti', kind: 'flat', value: 0.24 }, { stat: 'damage', kind: 'more', value: 0.12 }] };

    case 'ballista_sentry':
      if (r === 3 || r === 6) return { summary: '+1 Ballista Bolt, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 0) return { summary: '+16% Attack Speed, +1 Pierce, +10% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.16 }, { stat: 'pierceCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+8% Crit Chance, +10% Armor Pen, +10% More Damage', mods: [{ stat: 'critChance', kind: 'flat', value: 0.08 }, { stat: 'armorPen', kind: 'flat', value: 0.1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'flame_totem':
      if (r === 3 || r === 6) return { summary: '+1 Firebolt, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r % 2 === 0) return { summary: '+18% Cast Speed, +10% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.18 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+18% Ignite Chance, +8% Fire Pen, +10% More Damage', mods: [{ stat: 'igniteChance', kind: 'flat', value: 0.18 }, { stat: 'firePen', kind: 'flat', value: 0.08 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'fire_mine':
    case 'frost_trap': {
      const isCold = artId === 'frost_trap';
      if (r % 2 === 0) return { summary: '+18% Blast Area, +15% Cooldown Recovery, +10% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.18 }, { stat: 'cooldownRecovery', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return {
        summary: isCold ? '+22% Chill Chance, +8% Cold Pen, +12% More Damage' : '+20% Ignite Chance, +8% Fire Pen, +12% More Damage',
        mods: [
          { stat: isCold ? 'chillChance' : 'igniteChance', kind: 'flat', value: isCold ? 0.22 : 0.2 },
          { stat: isCold ? 'coldPen' : 'firePen', kind: 'flat', value: 0.08 },
          { stat: 'damage', kind: 'more', value: 0.12 },
        ],
      };
    }

    default:
      return { summary: '+16% More Art Damage', mods: [{ stat: 'damage', kind: 'more', value: 0.16 }] };
  }
}

export function getArtModsForRank(artId: string, level: number): Modifier[] {
  const mods: Modifier[] = [];
  for (let r = 2; r <= level; r++) {
    mods.push(...getArtRankStep(artId, r).mods);
  }
  return mods;
}
