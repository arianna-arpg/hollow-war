import type { SkillDamageSpec } from '../sdk/combat-resolver.ts';
import type { ConversionRule, ExtraDamageRule, Modifier, SkillTag } from '../sdk/types.ts';

export const MAX_ACTIVE_ARTS = 4;
export const MAX_ART_RANK = 8;
export const MAX_INSCRIPTIONS_PER_ART = 2;

export type ArtBehavior =
  | 'projectile'
  | 'projectile_nova'
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
      'Draws a searing shaft of ember-tipped iron that pierces ranks and kindles fierce ignites.',
    color: '#fb923c',
    behavior: 'projectile',
    baseDamage: { physical: 14, fire: 18 },
    damageEffectiveness: 1.05,
    baseCooldown: 0.68,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 6,
    projectileSpeed: 640,
    basePierce: 1,
    tags: ['attack', 'projectile', 'fire', 'physical'],
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
      'Flings a tight crescent of tempered daggers that pierce ranks and punish exposed flanks.',
    color: '#a3b899',
    behavior: 'projectile',
    baseDamage: { physical: 15, chaos: 5 },
    damageEffectiveness: 0.75,
    baseCooldown: 0.54,
    baseCritChance: 0.08,
    baseProjectiles: 3,
    baseRadius: 5,
    projectileSpeed: 620,
    tags: ['attack', 'projectile', 'physical'],
  },
  soul_rend: {
    id: 'soul_rend',
    name: 'Soul Rend',
    description:
      'Releases homing orbs of grave-violet ruin that curve toward nearby hosts and burst in a chaos splash on impact.',
    color: '#c084fc',
    behavior: 'projectile',
    baseDamage: { chaos: 20 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.66,
    baseCritChance: 0.04,
    baseProjectiles: 2,
    baseRadius: 7,
    projectileSpeed: 430,
    homing: true,
    explodeRadius: 68,
    explodeScale: 0.65,
    tags: ['spell', 'projectile', 'aoe', 'chaos'],
  },
  poison_nova: {
    id: 'poison_nova',
    name: 'Poison Nova',
    description:
      'Launches a 360° ring of venom projectiles outward from your vessel, scaling with extra projectiles and pierce.',
    color: '#a855f7',
    behavior: 'projectile_nova',
    baseDamage: { chaos: 18 },
    damageEffectiveness: 0.9,
    baseCooldown: 1.15,
    baseCritChance: 0.03,
    baseProjectiles: 8,
    baseRadius: 6,
    projectileSpeed: 430,
    tags: ['spell', 'projectile', 'chaos'],
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
      'Consecrated war-hammers orbit your bastion, crushing any demon or risen corpse that closes in.',
    color: '#f59e0b',
    behavior: 'orbit',
    baseDamage: { physical: 18, fire: 10 },
    damageEffectiveness: 0.9,
    baseCooldown: 0.46,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 82,
    tags: ['attack', 'orbit', 'physical', 'fire'],
  },
  consecration: {
    id: 'consecration',
    name: 'Consecration',
    description:
      'Sanctifies a lingering patch of ground for 4.5s that periodically scorches enemies within its radius.',
    color: '#fbbf24',
    behavior: 'ground_zone',
    baseDamage: { fire: 14, physical: 8 },
    damageEffectiveness: 0.85,
    baseCooldown: 2.6,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 128,
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
  raise_skeleton: {
    id: 'raise_skeleton',
    name: 'Raise Skeleton',
    description:
      'Calls forth bound Skeletal Vanguards from the barrow to hunt nearby foes with iron blades.',
    color: '#c9bfa8',
    behavior: 'minion',
    baseDamage: { physical: 20 },
    damageEffectiveness: 0.9,
    baseCooldown: 0.85,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 14,
    tags: ['attack', 'minion', 'physical'],
  },
  flame_sprite: {
    id: 'flame_sprite',
    name: 'Bind Flame Sprite',
    description:
      'Binds hovering cinder sprites to your shoulder that spit searing firebolts at advancing hosts.',
    color: '#fb923c',
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
  bone_golem: {
    id: 'bone_golem',
    name: 'Bone Golem',
    description:
      'Assembles a towering osseous guardian that charges packs and crushes them with seismic slams.',
    color: '#d6d3d1',
    behavior: 'minion',
    baseDamage: { physical: 34 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.25,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 72,
    tags: ['attack', 'minion', 'aoe', 'physical'],
  },
  frost_trap: {
    id: 'frost_trap',
    name: 'Frost Trap',
    description:
      'Places a rune of biting hoarfrost that shatters into a chilling ring when foes step upon it.',
    color: '#22d3ee',
    behavior: 'trap',
    baseDamage: { cold: 34 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.4,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 118,
    tags: ['spell', 'trap', 'aoe', 'cold'],
  },
  void_orb: {
    id: 'void_orb',
    name: 'Void Orb',
    description:
      'Looses a slow, heavy sphere of abyssal ruin that pierces ranks and pulses chaos blasts on each strike.',
    color: '#9333ea',
    behavior: 'projectile',
    baseDamage: { chaos: 28 },
    damageEffectiveness: 1.15,
    baseCooldown: 0.95,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 13,
    projectileSpeed: 310,
    basePierce: 4,
    explodeRadius: 56,
    explodeScale: 0.55,
    tags: ['spell', 'projectile', 'aoe', 'chaos'],
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
