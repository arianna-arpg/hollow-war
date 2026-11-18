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
  | 'cascade_line'
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
  baseDuration?: number;
  staggerDelay?: number;
  baseChain?: number;
  basePierce?: number;
  homing?: boolean;
  explodeRadius?: number;
  explodeScale?: number;
  timedSummon?: boolean;
  maxSummons?: number;
  sweepProjectiles?: {
    count: number;
    speed: number;
    duration: number;
    radius: number;
    pierce?: number;
    explodeRadius?: number;
    explodeScale?: number;
  };
  tags: readonly SkillTag[];
}

export interface InscriptionDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  requiredTags?: readonly SkillTag[];
  /** If set, the Art must currently deal > 0 of at least one of these DamageTypes (including conversions/extras). */
  relevantElements?: readonly ('physical' | 'fire' | 'cold' | 'lightning' | 'chaos')[];
  mods: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  echoChance?: number;
  returnBoomerang?: boolean;
  forceHoming?: boolean;
  spreadScale?: number;
  staggerOverride?: number;
  splitOnHit?: number;
  sweepArcScale?: number;
  sweepReachOffset?: number;
  reverseSweep?: boolean;
  aftershockDelay?: number;
  aftershockScale?: number;
  strikeWaveCount?: number;
  executeBonus?: number;
  knockbackForce?: number;
  explodeOnExpire?: number;
  minionSpeedScale?: number;
  minionCleaveRadius?: number;
  trapCountBonus?: number;
}

export const ARTS: Record<string, ArtDefinition> = {
  firebolt: {
    id: 'firebolt',
    name: 'Firebolt',
    description:
      'Looses a nimble lance of condensed cinder that streaks across the ash and sets struck flesh alight.',
    color: '#f97316',
    behavior: 'projectile',
    baseDamage: { fire: 22, physical: 6 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.58,
    baseCritChance: 0.02,
    baseProjectiles: 1,
    baseRadius: 7,
    projectileSpeed: 550,
    baseDuration: 1.5,
    tags: ['spell', 'projectile', 'fire'],
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description:
      'Hurls a heavy, slow-traveling sphere of condensed flame that detonates in a wide fiery blast on impact.',
    color: '#ea580c',
    behavior: 'projectile',
    baseDamage: { fire: 30 },
    damageEffectiveness: 1.25,
    baseCooldown: 0.86,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 11,
    projectileSpeed: 370,
    baseDuration: 1.05,
    explodeRadius: 88,
    explodeScale: 0.75,
    tags: ['spell', 'projectile', 'aoe', 'fire'],
  },
  flame_arrow: {
    id: 'flame_arrow',
    name: 'Flame Arrow',
    description:
      'Fires a swift flaming arrow that pierces up to 2 enemies across long range.',
    color: '#ff9646',
    behavior: 'projectile',
    baseDamage: { fire: 22, physical: 8 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.56,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 5,
    projectileSpeed: 650,
    baseDuration: 1.6,
    basePierce: 2,
    tags: ['spell', 'projectile', 'fire'],
  },
  piercing_arrow: {
    id: 'piercing_arrow',
    name: 'Piercing Arrow',
    description:
      'Looses a high-velocity iron shaft that punches straight through up to 3 enemies across long range.',
    color: '#e2e8f0',
    behavior: 'projectile',
    baseDamage: { physical: 26 },
    damageEffectiveness: 1.1,
    baseCooldown: 0.62,
    baseCritChance: 0.08,
    baseProjectiles: 1,
    baseRadius: 5,
    projectileSpeed: 740,
    baseDuration: 1.75,
    basePierce: 3,
    tags: ['attack', 'projectile', 'physical'],
  },
  frostbolt: {
    id: 'frostbolt',
    name: 'Frostbolt',
    description:
      'Conjures razor shards of winter-glass that chill targets as they glide across the barrow.',
    color: '#38bdf8',
    behavior: 'projectile',
    baseDamage: { cold: 23 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.56,
    baseCritChance: 0.05,
    baseProjectiles: 2,
    baseRadius: 6,
    projectileSpeed: 440,
    baseDuration: 1.35,
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
      'Unfurls a staggered, close-range fan of 5 tempered knives in a wide frontal arc.',
    color: '#c0c8d8',
    behavior: 'projectile',
    baseDamage: { physical: 15 },
    damageEffectiveness: 0.75,
    baseCooldown: 0.66,
    baseCritChance: 0.08,
    baseProjectiles: 5,
    baseRadius: 5.5,
    projectileSpeed: 500,
    baseDuration: 0.45,
    staggerDelay: 0.028,
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
    baseDamage: { fire: 18 },
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
      'Raises a timed squad of 3 Skeletal Warriors (up to 24 active) from the barrow to hunt nearby foes; Duration and Cast Speed expand your army.',
    color: '#cfc8b8',
    behavior: 'minion',
    baseDamage: { physical: 26 },
    damageEffectiveness: 1.0,
    baseCooldown: 2.2,
    baseCritChance: 0.06,
    baseProjectiles: 3,
    baseRadius: 14,
    baseDuration: 11,
    timedSummon: true,
    maxSummons: 24,
    tags: ['spell', 'minion', 'physical'],
  },
  summon_flame_sprite: {
    id: 'summon_flame_sprite',
    name: 'Summon Flame Sprite',
    description:
      'Summons living Flame Sprites that hover beside you and cast Firebolts at nearby enemies.',
    color: '#ffb05a',
    behavior: 'minion',
    baseDamage: { fire: 22 },
    damageEffectiveness: 0.95,
    baseCooldown: 0.72,
    baseCritChance: 0.05,
    baseProjectiles: 3,
    baseRadius: 10,
    projectileSpeed: 500,
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
    baseDamage: { physical: 42 },
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
  arcane_missiles: {
    id: 'arcane_missiles',
    name: 'Arcane Missiles',
    description:
      'Launches a staggered salvo of 4 seeking arcane bolts that weave toward nearby enemies.',
    color: '#818cf8',
    behavior: 'projectile',
    baseDamage: { lightning: 10, chaos: 8 },
    damageEffectiveness: 0.75,
    baseCooldown: 0.72,
    baseCritChance: 0.05,
    baseProjectiles: 4,
    baseRadius: 5,
    projectileSpeed: 540,
    baseDuration: 1.45,
    staggerDelay: 0.055,
    homing: true,
    tags: ['spell', 'projectile', 'lightning', 'chaos'],
  },
  shock_nova: {
    id: 'shock_nova',
    name: 'Shock Nova',
    description:
      'Unleashes a crackling ring of storm-light around your vessel, dealing Lightning damage and Shocking foes.',
    color: '#fde047',
    behavior: 'nova',
    baseDamage: { lightning: 28 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.32,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 156,
    tags: ['spell', 'aoe', 'nova', 'lightning'],
  },
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    description:
      'Delivers a crushing overhead blow in a tight frontal arc with heavy Armor Penetration and Critical impact.',
    color: '#e2e8f0',
    behavior: 'sweep',
    baseDamage: { physical: 44 },
    damageEffectiveness: 1.4,
    baseCooldown: 0.92,
    baseCritChance: 0.1,
    baseProjectiles: 1,
    baseRadius: 102,
    tags: ['attack', 'aoe', 'physical'],
  },
  molten_strike: {
    id: 'molten_strike',
    name: 'Molten Strike',
    description:
      'Slams the warfront with a blazing weapon arc and hurls 3 explosive molten embers outward.',
    color: '#fb923c',
    behavior: 'sweep',
    baseDamage: { fire: 24, physical: 12 },
    damageEffectiveness: 1.15,
    baseCooldown: 0.84,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 105,
    sweepProjectiles: {
      count: 3,
      speed: 350,
      duration: 0.62,
      radius: 8,
      explodeRadius: 54,
      explodeScale: 0.65,
    },
    tags: ['attack', 'aoe', 'projectile', 'fire'],
  },
  frost_blades: {
    id: 'frost_blades',
    name: 'Frost Blades',
    description:
      'Carves a chilling frontal crescent that flings 3 piercing ice shards across the battlefield.',
    color: '#67e8f9',
    behavior: 'sweep',
    baseDamage: { cold: 22, physical: 10 },
    damageEffectiveness: 1.05,
    baseCooldown: 0.68,
    baseCritChance: 0.08,
    baseProjectiles: 1,
    baseRadius: 100,
    sweepProjectiles: {
      count: 3,
      speed: 560,
      duration: 0.85,
      radius: 6,
      pierce: 2,
    },
    tags: ['attack', 'aoe', 'projectile', 'cold'],
  },
  ice_spear: {
    id: 'ice_spear',
    name: 'Ice Spear',
    description:
      'Lances a razor-sharp spike of condensed frost with high velocity, innate piercing, and lethal critical strike chance.',
    color: '#a5f3fc',
    behavior: 'projectile',
    baseDamage: { cold: 28 },
    damageEffectiveness: 1.15,
    baseCooldown: 0.72,
    baseCritChance: 0.14,
    baseProjectiles: 1,
    baseRadius: 7,
    projectileSpeed: 640,
    baseDuration: 1.4,
    basePierce: 2,
    tags: ['spell', 'projectile', 'cold'],
  },
  glacial_cascade: {
    id: 'glacial_cascade',
    name: 'Glacial Cascade',
    description:
      'Erupts a surging line of 3 overlapping frost bursts in your aim direction, shattering clustered foes.',
    color: '#38bdf8',
    behavior: 'cascade_line',
    baseDamage: { cold: 24, physical: 10 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.12,
    baseCritChance: 0.06,
    baseProjectiles: 3,
    baseRadius: 76,
    tags: ['spell', 'aoe', 'cold'],
  },
  rime_totem: {
    id: 'rime_totem',
    name: 'Rime Totem',
    description:
      'Plants a crystalline frost spire that fires chilling bolts at nearby enemies.',
    color: '#7dd3fc',
    behavior: 'totem',
    baseDamage: { cold: 18 },
    damageEffectiveness: 0.9,
    baseCooldown: 2.8,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 7,
    projectileSpeed: 500,
    baseDuration: 1.3,
    tags: ['spell', 'totem', 'projectile', 'cold'],
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    description:
      'Unleashes 3 crackling lightning sparks that zip rapidly through ranks with innate pierce.',
    color: '#fef08a',
    behavior: 'projectile',
    baseDamage: { lightning: 16 },
    damageEffectiveness: 0.75,
    baseCooldown: 0.62,
    baseCritChance: 0.06,
    baseProjectiles: 3,
    baseRadius: 6,
    projectileSpeed: 590,
    baseDuration: 1.25,
    basePierce: 2,
    tags: ['spell', 'projectile', 'lightning'],
  },
  ball_lightning: {
    id: 'ball_lightning',
    name: 'Ball Lightning',
    description:
      'Releases a slow-drifting orb of storm plasma that pierces endlessly and pulses with electrical blasts.',
    color: '#facc15',
    behavior: 'projectile',
    baseDamage: { lightning: 22 },
    damageEffectiveness: 0.95,
    baseCooldown: 1.05,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 19,
    projectileSpeed: 215,
    baseDuration: 2.2,
    basePierce: 99,
    explodeRadius: 58,
    explodeScale: 0.5,
    tags: ['spell', 'projectile', 'aoe', 'lightning'],
  },
  lightning_strike: {
    id: 'lightning_strike',
    name: 'Lightning Strike',
    description:
      'Sweeps a storm-charged weapon arc that discharges 3 crackling lightning bolts forward.',
    color: '#fde047',
    behavior: 'sweep',
    baseDamage: { lightning: 24, physical: 10 },
    damageEffectiveness: 1.1,
    baseCooldown: 0.74,
    baseCritChance: 0.07,
    baseProjectiles: 1,
    baseRadius: 104,
    sweepProjectiles: {
      count: 3,
      speed: 620,
      duration: 0.78,
      radius: 6,
      pierce: 1,
    },
    tags: ['attack', 'aoe', 'projectile', 'lightning'],
  },
  voltaic_sentry: {
    id: 'voltaic_sentry',
    name: 'Voltaic Sentry',
    description:
      'Raises an arc-conductor pylon that discharges chaining lightning across nearby foes.',
    color: '#eab308',
    behavior: 'totem',
    baseDamage: { lightning: 20 },
    damageEffectiveness: 0.9,
    baseCooldown: 2.9,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 210,
    baseChain: 2,
    tags: ['spell', 'totem', 'chain', 'lightning'],
  },
  essence_drain: {
    id: 'essence_drain',
    name: 'Essence Drain',
    description:
      'Fires a piercing bolt of grave-blight that withers foes and steals a sliver of life on impact.',
    color: '#c084fc',
    behavior: 'projectile',
    baseDamage: { chaos: 28 },
    damageEffectiveness: 1.1,
    baseCooldown: 0.76,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 8,
    projectileSpeed: 500,
    baseDuration: 1.6,
    basePierce: 1,
    tags: ['spell', 'projectile', 'chaos', 'dot'],
  },
  viper_strike: {
    id: 'viper_strike',
    name: 'Viper Strike',
    description:
      'Executes a swift venomous slash that tears through enemies with chaos-tainted steel.',
    color: '#84cc16',
    behavior: 'sweep',
    baseDamage: { chaos: 18, physical: 14 },
    damageEffectiveness: 1.05,
    baseCooldown: 0.56,
    baseCritChance: 0.08,
    baseProjectiles: 1,
    baseRadius: 96,
    tags: ['attack', 'aoe', 'chaos', 'physical', 'dot'],
  },
  blight_zone: {
    id: 'blight_zone',
    name: 'Blighted Ground',
    description:
      'Desecrates the earth beneath you with creeping chaos miasma that pulses and poisons all foes inside.',
    color: '#a855f7',
    behavior: 'ground_zone',
    baseDamage: { chaos: 14 },
    damageEffectiveness: 0.65,
    baseCooldown: 2.6,
    baseCritChance: 0.02,
    baseProjectiles: 1,
    baseRadius: 118,
    tags: ['spell', 'aoe', 'chaos', 'dot'],
  },
  soulrend: {
    id: 'soulrend',
    name: 'Soulrend',
    description:
      'Looses a homing violet soul-reaver that pierces through enemies and leaves a trail of ruin.',
    color: '#d946ef',
    behavior: 'projectile',
    baseDamage: { chaos: 24 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.85,
    baseCritChance: 0.05,
    baseProjectiles: 1,
    baseRadius: 9,
    projectileSpeed: 420,
    baseDuration: 1.9,
    basePierce: 2,
    homing: true,
    tags: ['spell', 'projectile', 'chaos', 'dot'],
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
    relevantElements: ['fire'],
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
    relevantElements: ['cold'],
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
    relevantElements: ['fire', 'cold', 'lightning'],
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
  voltaic_arc: {
    id: 'voltaic_arc',
    name: 'Inscription of Voltaic Surge',
    shortName: 'Voltaic',
    description: 'Overcharges the strike with storm-fire: +40% Shock Chance and +25% More Lightning Damage, but 15% Less Fire & Cold Damage.',
    color: '#fde047',
    relevantElements: ['lightning'],
    mods: [
      { stat: 'shockChance', kind: 'flat', value: 0.4 },
      { stat: 'lightningDamage', kind: 'more', value: 0.25 },
      { stat: 'fireDamage', kind: 'more', value: -0.15 },
      { stat: 'coldDamage', kind: 'more', value: -0.15 },
    ],
  },
  venomous_ruin: {
    id: 'venomous_ruin',
    name: 'Inscription of Venomous Ruin',
    shortName: 'Venomous',
    description: 'Steeps the Art in blight: +40% Poison Chance and +35% More Ailment/DoT Damage, but 15% Less Direct Hit Damage.',
    color: '#66c83c',
    relevantElements: ['chaos'],
    mods: [
      { stat: 'poisonChance', kind: 'flat', value: 0.4 },
      { stat: 'dotDamage', kind: 'more', value: 0.35 },
      { stat: 'damage', kind: 'more', value: -0.15 },
    ],
  },
  lacerating_edge: {
    id: 'lacerating_edge',
    name: 'Inscription of Laceration',
    shortName: 'Laceration',
    description: 'Serrates the impact: +45% Bleed Chance and +25% More Physical Damage, but -18% Area of Effect.',
    color: '#ef4444',
    relevantElements: ['physical'],
    mods: [
      { stat: 'bleedChance', kind: 'flat', value: 0.45 },
      { stat: 'physicalDamage', kind: 'more', value: 0.25 },
      { stat: 'area', kind: 'inc', value: -0.18 },
    ],
  },
  rapid_cadence: {
    id: 'rapid_cadence',
    name: 'Inscription of Rapid Cadence',
    shortName: 'Cadence',
    description: 'Quickens the Art’s rhythm: +25% Cooldown Recovery and +18% Attack & Cast Speed, but 12% Less Art Damage.',
    color: '#7dd3fc',
    mods: [
      { stat: 'cooldownRecovery', kind: 'inc', value: 0.25 },
      { stat: 'castSpeed', kind: 'inc', value: 0.18 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.18 },
      { stat: 'damage', kind: 'more', value: -0.12 },
    ],
  },
  pyromancer_brand: {
    id: 'pyromancer_brand',
    name: 'Inscription of the Furnace Brand',
    shortName: 'Furnace Brand',
    description: 'Converts 50% of Physical & Cold Damage to Fire and grants +15% Fire Pen, at the cost of 15% Less Cold Damage.',
    color: '#f97316',
    relevantElements: ['physical', 'cold'],
    conversions: [
      { from: 'physical', to: 'fire', ratio: 0.5 },
      { from: 'cold', to: 'fire', ratio: 0.5 },
    ],
    mods: [
      { stat: 'firePen', kind: 'flat', value: 0.15 },
      { stat: 'coldDamage', kind: 'more', value: -0.15 },
    ],
  },
  abyssal_brand: {
    id: 'abyssal_brand',
    name: 'Inscription of the Abyssal Brand',
    shortName: 'Abyssal Brand',
    description: 'Converts 50% of Physical & Lightning Damage to Chaos and grants +15% Chaos Pen, but -25% Critical Strike Multiplier.',
    color: '#a855f7',
    relevantElements: ['physical', 'lightning'],
    conversions: [
      { from: 'physical', to: 'chaos', ratio: 0.5 },
      { from: 'lightning', to: 'chaos', ratio: 0.5 },
    ],
    mods: [
      { stat: 'chaosPen', kind: 'flat', value: 0.15 },
      { stat: 'critMulti', kind: 'flat', value: -0.25 },
    ],
  },
  overcharged_traps: {
    id: 'overcharged_traps',
    name: 'Inscription of Overcharged Snares',
    shortName: 'Overcharged',
    description: 'Accelerates trap arming: +25% Cooldown Recovery and +15% Base Crit Chance, but -15% Blast Area.',
    color: '#fbbf24',
    requiredTags: ['trap'],
    mods: [
      { stat: 'cooldownRecovery', kind: 'inc', value: 0.25 },
      { stat: 'critChance', kind: 'flat', value: 0.15 },
      { stat: 'area', kind: 'inc', value: -0.15 },
    ],
  },
  far_reach: {
    id: 'far_reach',
    name: 'Inscription of Far Reach',
    shortName: 'Far Reach',
    description: 'Extends projectile flight across the barrow: +45% Projectile Speed and +45% Projectile Range/Duration, but 12% Less Projectile Damage.',
    color: '#38bdf8',
    requiredTags: ['projectile'],
    mods: [
      { stat: 'projectileSpeed', kind: 'inc', value: 0.45 },
      { stat: 'projectileDuration', kind: 'inc', value: 0.45 },
      { stat: 'damage', kind: 'more', value: -0.12, tags: ['projectile'] },
    ],
  },
  frenzied_thralls: {
    id: 'frenzied_thralls',
    name: 'Inscription of Frenzied Thralls',
    shortName: 'Frenzied',
    description: 'Drives bound minions into a frenzy: +35% More Minion Attack & Cast Speed, at the cost of 15% Less Minion Damage.',
    color: '#f87171',
    requiredTags: ['minion'],
    mods: [
      { stat: 'attackSpeed', kind: 'more', value: 0.35 },
      { stat: 'castSpeed', kind: 'more', value: 0.35 },
      { stat: 'damage', kind: 'more', value: -0.15 },
    ],
  },
  titanic_constructs: {
    id: 'titanic_constructs',
    name: 'Inscription of Titanic Frame',
    shortName: 'Titanic',
    description: 'Reinforces minions into heavy bruisers: +40% More Minion Damage and +25% Area, but 22% Less Minion Speed.',
    color: '#d6d3d1',
    requiredTags: ['minion'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.4 },
      { stat: 'area', kind: 'inc', value: 0.25 },
      { stat: 'attackSpeed', kind: 'more', value: -0.22 },
      { stat: 'castSpeed', kind: 'more', value: -0.22 },
    ],
  },
  necrotic_claws: {
    id: 'necrotic_claws',
    name: 'Inscription of Necrotic Claws',
    shortName: 'Necrotic',
    description: 'Coats minion strikes in rot: +35% Bleed & Poison Chance and +20% Armor Pen, but -20% Crit Multiplier.',
    color: '#a855f7',
    requiredTags: ['minion'],
    mods: [
      { stat: 'bleedChance', kind: 'flat', value: 0.35 },
      { stat: 'poisonChance', kind: 'flat', value: 0.35 },
      { stat: 'armorPen', kind: 'flat', value: 0.2 },
      { stat: 'critMulti', kind: 'flat', value: -0.2 },
    ],
  },
  twin_pylons: {
    id: 'twin_pylons',
    name: 'Inscription of Twin Pylons',
    shortName: 'Twin Pylons',
    description: 'Doubles the totem’s output: +1 Totem Projectile and +20% Cooldown Recovery, but 20% Less Totem Damage.',
    color: '#fbbf24',
    requiredTags: ['totem'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 1 },
      { stat: 'cooldownRecovery', kind: 'inc', value: 0.2 },
      { stat: 'damage', kind: 'more', value: -0.2 },
    ],
  },
  siegeworks: {
    id: 'siegeworks',
    name: 'Inscription of Siegeworks',
    shortName: 'Siegeworks',
    description: 'Heavy ballistics for totems: +35% More Totem Damage and +15% Armor & Fire Pen, but 20% Less Totem Speed.',
    color: '#c8b890',
    requiredTags: ['totem'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.35 },
      { stat: 'armorPen', kind: 'flat', value: 0.15 },
      { stat: 'firePen', kind: 'flat', value: 0.15 },
      { stat: 'attackSpeed', kind: 'more', value: -0.2 },
      { stat: 'castSpeed', kind: 'more', value: -0.2 },
    ],
  },
  volatile_powder: {
    id: 'volatile_powder',
    name: 'Inscription of Volatile Powder',
    shortName: 'Volatile',
    description: 'Packs extra blast powder into traps: +40% Blast Area and +25% Ignite & Chill Chance, but 15% Less Trap Damage.',
    color: '#fb7185',
    requiredTags: ['trap'],
    mods: [
      { stat: 'area', kind: 'inc', value: 0.4 },
      { stat: 'igniteChance', kind: 'flat', value: 0.25 },
      { stat: 'chillChance', kind: 'flat', value: 0.25 },
      { stat: 'damage', kind: 'more', value: -0.15 },
    ],
  },
  boomerang: {
    id: 'boomerang',
    name: 'Inscription of the Boomerang',
    shortName: 'Boomerang',
    description: 'Projectiles curve back to you after half their flight, striking foes on the return pass (+20% Range/Duration, 15% Less Damage).',
    color: '#34d399',
    requiredTags: ['projectile'],
    returnBoomerang: true,
    mods: [
      { stat: 'projectileDuration', kind: 'inc', value: 0.2 },
      { stat: 'damage', kind: 'more', value: -0.15, tags: ['projectile'] },
    ],
  },
  seeker: {
    id: 'seeker',
    name: 'Inscription of the Seeker',
    shortName: 'Seeker',
    description: 'Grants homing guidance to projectiles and +20% Range/Duration, at the cost of 18% Less Projectile Speed.',
    color: '#c084fc',
    requiredTags: ['projectile'],
    forceHoming: true,
    mods: [
      { stat: 'projectileDuration', kind: 'inc', value: 0.2 },
      { stat: 'projectileSpeed', kind: 'more', value: -0.18 },
    ],
  },
  choked_spread: {
    id: 'choked_spread',
    name: 'Inscription of Choked Spread',
    shortName: 'Choked',
    description: 'Tightens projectile spread by 55% into a focused beam and grants +25% Projectile Speed, but -15% Area.',
    color: '#fbbf24',
    requiredTags: ['projectile'],
    spreadScale: 0.45,
    mods: [
      { stat: 'projectileSpeed', kind: 'inc', value: 0.25 },
      { stat: 'area', kind: 'inc', value: -0.15 },
    ],
  },
  firing_line: {
    id: 'firing_line',
    name: 'Inscription of the Firing Line',
    shortName: 'Firing Line',
    description: 'Staggers projectiles into a rapid sequential stream (+20% Attack & Cast Speed), at the cost of 14% Less Damage.',
    color: '#f97316',
    requiredTags: ['projectile'],
    staggerOverride: 0.045,
    spreadScale: 0.25,
    mods: [
      { stat: 'attackSpeed', kind: 'inc', value: 0.2 },
      { stat: 'castSpeed', kind: 'inc', value: 0.2 },
      { stat: 'damage', kind: 'more', value: -0.14, tags: ['projectile'] },
    ],
  },
  cascade: {
    id: 'cascade',
    name: 'Inscription of Cascade',
    shortName: 'Cascade',
    description: 'Projectiles splinter into 2 secondary shards on impact, at the cost of 22% Less Projectile Damage.',
    color: '#67e8f9',
    requiredTags: ['projectile'],
    splitOnHit: 2,
    mods: [{ stat: 'damage', kind: 'more', value: -0.22, tags: ['projectile'] }],
  },
  overwhelming_force: {
    id: 'overwhelming_force',
    name: 'Inscription of Overwhelming Force',
    shortName: 'Overwhelming',
    description: 'Swamps the arena in raw impact: +28% More Area Damage and +15% Area of Effect, but 15% Less Attack & Cast Speed.',
    color: '#f59e0b',
    requiredTags: ['aoe'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.28, tags: ['aoe'] },
      { stat: 'area', kind: 'inc', value: 0.15 },
      { stat: 'attackSpeed', kind: 'more', value: -0.15 },
      { stat: 'castSpeed', kind: 'more', value: -0.15 },
    ],
  },
  brutal_momentum: {
    id: 'brutal_momentum',
    name: 'Inscription of Brutal Momentum',
    shortName: 'Brutal',
    description: 'Drives heavy strikes through armor: +30% More Attack Damage and +15% Armor Pen, but -10% Critical Strike Chance.',
    color: '#d8b06a',
    requiredTags: ['attack'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.3, tags: ['attack'] },
      { stat: 'armorPen', kind: 'flat', value: 0.15 },
      { stat: 'critChance', kind: 'flat', value: -0.1 },
    ],
  },
  arcane_potency: {
    id: 'arcane_potency',
    name: 'Inscription of Arcane Potency',
    shortName: 'Arcane Potency',
    description: 'Sharpens spellcraft: +28% More Spell Damage and +10% Crit Chance, but -15% Area of Effect.',
    color: '#7a9aff',
    requiredTags: ['spell'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.28, tags: ['spell'] },
      { stat: 'critChance', kind: 'flat', value: 0.1 },
      { stat: 'area', kind: 'inc', value: -0.15 },
    ],
  },
  relentless_haste: {
    id: 'relentless_haste',
    name: 'Inscription of Relentless Haste',
    shortName: 'Haste',
    description: 'Accelerates every motion: +28% More Attack & Cast Speed, at the cost of 14% Less Art Damage.',
    color: '#34d399',
    mods: [
      { stat: 'attackSpeed', kind: 'more', value: 0.28 },
      { stat: 'castSpeed', kind: 'more', value: 0.28 },
      { stat: 'damage', kind: 'more', value: -0.14 },
    ],
  },
  twin_strikes: {
    id: 'twin_strikes',
    name: 'Inscription of Twin Strikes',
    shortName: 'Twin Strikes',
    description: 'Repeats the attack after a brief beat (+12% Attack Speed), at the cost of 15% Less Damage per strike.',
    color: '#fbbf24',
    requiredTags: ['attack'],
    echoChance: 1.0,
    mods: [
      { stat: 'attackSpeed', kind: 'inc', value: 0.12 },
      { stat: 'damage', kind: 'more', value: -0.15, tags: ['attack'] },
    ],
  },
  sweeping_arc: {
    id: 'sweeping_arc',
    name: 'Inscription of Sweeping Arc',
    shortName: 'Sweeping Arc',
    description: 'Widens melee cleave arcs by +55% and grants +30% Area of Effect, but 10% Less Attack Speed.',
    color: '#f59e0b',
    requiredTags: ['attack', 'aoe'],
    sweepArcScale: 1.55,
    mods: [
      { stat: 'area', kind: 'inc', value: 0.3 },
      { stat: 'attackSpeed', kind: 'more', value: -0.1 },
    ],
  },
  aftershock: {
    id: 'aftershock',
    name: 'Inscription of Aftershock',
    shortName: 'Aftershock',
    description: 'Every strike leaves a delayed seismic eruption for 65% Area Damage and +15% Area.',
    color: '#f97316',
    requiredTags: ['attack', 'aoe'],
    aftershockDelay: 0.35,
    aftershockScale: 0.65,
    mods: [{ stat: 'area', kind: 'inc', value: 0.15 }],
  },
  culling_edge: {
    id: 'culling_edge',
    name: 'Inscription of Execution',
    shortName: 'Execution',
    description: '+40% More Damage against wounded foes below 50% Life and +12% Base Crit Chance.',
    color: '#ef4444',
    requiredTags: ['attack'],
    executeBonus: 0.4,
    mods: [{ stat: 'critChance', kind: 'flat', value: 0.12 }],
  },
  lunging_step: {
    id: 'lunging_step',
    name: 'Inscription of Lunging Step',
    shortName: 'Lunging Step',
    description: 'Projects melee strikes forward by 38px with +20% Area and +15% Attack Speed.',
    color: '#38bdf8',
    requiredTags: ['attack', 'aoe'],
    sweepReachOffset: 38,
    mods: [
      { stat: 'area', kind: 'inc', value: 0.2 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.15 },
    ],
  },
  deep_wounds: {
    id: 'deep_wounds',
    name: 'Inscription of Deep Wounds',
    shortName: 'Deep Wounds',
    description: 'Tears arteries open: +50% Bleed Chance, +35% Ailment/DoT Damage, and +25% Crit Multiplier.',
    color: '#dc2626',
    requiredTags: ['attack'],
    mods: [
      { stat: 'bleedChance', kind: 'flat', value: 0.5 },
      { stat: 'dotDamage', kind: 'inc', value: 0.35 },
      { stat: 'critMulti', kind: 'flat', value: 0.25 },
    ],
  },
  razor_tempest: {
    id: 'razor_tempest',
    name: 'Inscription of Razor Tempest',
    shortName: 'Razor Tempest',
    description: 'Melee strikes hurl 2 piercing blade-waves forward for 55% damage, plus +15% Attack Damage.',
    color: '#a3e635',
    requiredTags: ['attack', 'aoe'],
    strikeWaveCount: 2,
    mods: [{ stat: 'damage', kind: 'inc', value: 0.15, tags: ['attack'] }],
  },
  crushing_blow: {
    id: 'crushing_blow',
    name: 'Inscription of Crushing Blow',
    shortName: 'Crushing Blow',
    description: 'Staggers and knocks enemies back on hit with +35% More Attack Damage, but 15% Less Attack Speed.',
    color: '#d8b06a',
    requiredTags: ['attack'],
    knockbackForce: 55,
    mods: [
      { stat: 'damage', kind: 'more', value: 0.35, tags: ['attack'] },
      { stat: 'attackSpeed', kind: 'more', value: -0.15 },
    ],
  },
  bloodthirst: {
    id: 'bloodthirst',
    name: 'Inscription of Bloodthirst',
    shortName: 'Bloodthirst',
    description: 'Feeds on battle: +4% Life Leech, +20% Attack Speed, and +12% Move Speed.',
    color: '#fb7185',
    requiredTags: ['attack'],
    mods: [
      { stat: 'lifeLeech', kind: 'flat', value: 0.04 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.2 },
      { stat: 'moveSpeed', kind: 'inc', value: 0.12 },
    ],
  },
  phantom_reach: {
    id: 'phantom_reach',
    name: 'Inscription of Phantom Reach',
    shortName: 'Phantom Reach',
    description: 'Echoes a mirrored phantom slash behind you on every swing, plus +15% Attack Damage.',
    color: '#c084fc',
    requiredTags: ['attack', 'aoe'],
    reverseSweep: true,
    mods: [{ stat: 'damage', kind: 'inc', value: 0.15, tags: ['attack'] }],
  },
  volatile_thralls: {
    id: 'volatile_thralls',
    name: 'Inscription of Minion Instability',
    shortName: 'Instability',
    description: 'When a minion expires or is replaced, it detonates in a fiery blast for 90% Art Damage (+15% Area).',
    color: '#fb923c',
    requiredTags: ['minion'],
    explodeOnExpire: 0.9,
    mods: [{ stat: 'area', kind: 'inc', value: 0.15 }],
  },
  swarm_commander: {
    id: 'swarm_commander',
    name: 'Inscription of the Endless Tide',
    shortName: 'Endless Tide',
    description: '+2 Summons / Minion Count and +25% Minion Duration, at the cost of 15% Less Minion Damage.',
    color: '#e2e8f0',
    requiredTags: ['minion'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 2 },
      { stat: 'projectileDuration', kind: 'inc', value: 0.25 },
      { stat: 'damage', kind: 'more', value: -0.15 },
    ],
  },
  unholy_frenzy: {
    id: 'unholy_frenzy',
    name: 'Inscription of Unholy Frenzy',
    shortName: 'Unholy Frenzy',
    description: '+40% More Minion Attack & Cast Speed and +35% Minion Move Speed, but 15% Less Minion Damage.',
    color: '#f87171',
    requiredTags: ['minion'],
    minionSpeedScale: 1.35,
    mods: [
      { stat: 'attackSpeed', kind: 'more', value: 0.4 },
      { stat: 'castSpeed', kind: 'more', value: 0.4 },
      { stat: 'damage', kind: 'more', value: -0.15 },
    ],
  },
  chilling_presence: {
    id: 'chilling_presence',
    name: 'Inscription of Gravechill',
    shortName: 'Gravechill',
    description: 'Converts 50% of Physical to Cold, granting +35% Chill Chance and +20% Area.',
    color: '#67e8f9',
    requiredTags: ['minion'],
    relevantElements: ['physical', 'cold'],
    conversions: [{ from: 'physical', to: 'cold', ratio: 0.5 }],
    mods: [
      { stat: 'chillChance', kind: 'flat', value: 0.35 },
      { stat: 'area', kind: 'inc', value: 0.2 },
    ],
  },
  blighted_legion: {
    id: 'blighted_legion',
    name: 'Inscription of Blighted Hosts',
    shortName: 'Blighted Hosts',
    description: 'Minions gain 25% of Physical as Extra Chaos, +50% Poison Chance, and +30% DoT Damage.',
    color: '#a855f7',
    requiredTags: ['minion'],
    relevantElements: ['physical', 'chaos'],
    extras: [{ from: 'physical', to: 'chaos', ratio: 0.25 }],
    mods: [
      { stat: 'poisonChance', kind: 'flat', value: 0.5 },
      { stat: 'dotDamage', kind: 'inc', value: 0.3 },
    ],
  },
  cleaving_thralls: {
    id: 'cleaving_thralls',
    name: 'Inscription of Sweeping Thralls',
    shortName: 'Sweeping Thralls',
    description: 'Minion melee strikes cleave nearby foes in an arc with +35% Area and +20% More Minion Damage.',
    color: '#fbbf24',
    requiredTags: ['minion'],
    minionCleaveRadius: 54,
    mods: [
      { stat: 'area', kind: 'inc', value: 0.35 },
      { stat: 'damage', kind: 'more', value: 0.2 },
    ],
  },
  soul_tether: {
    id: 'soul_tether',
    name: 'Inscription of Soul-Tether',
    shortName: 'Soul-Tether',
    description: 'Minion hits siphon 3% Life to you and deal +20% More Minion Damage.',
    color: '#fb7185',
    requiredTags: ['minion'],
    mods: [
      { stat: 'lifeLeech', kind: 'flat', value: 0.03 },
      { stat: 'damage', kind: 'more', value: 0.2 },
    ],
  },
  clockwork_overdrive: {
    id: 'clockwork_overdrive',
    name: 'Inscription of Overdrive',
    shortName: 'Overdrive',
    description: 'Totems gain +1 Projectile/Chain and +25% Attack & Cast Speed, but -15% Duration.',
    color: '#38bdf8',
    requiredTags: ['totem'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 1 },
      { stat: 'chainCount', kind: 'flat', value: 1 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.25 },
      { stat: 'castSpeed', kind: 'inc', value: 0.25 },
      { stat: 'projectileDuration', kind: 'inc', value: -0.15 },
    ],
  },
  cluster_traps: {
    id: 'cluster_traps',
    name: 'Inscription of Cluster Snares',
    shortName: 'Cluster Snares',
    description: 'Throws +2 extra traps per cast, at the cost of 20% Less Trap Damage.',
    color: '#f43f5e',
    requiredTags: ['trap'],
    trapCountBonus: 2,
    mods: [{ stat: 'damage', kind: 'more', value: -0.2 }],
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

    case 'piercing_arrow':
      if (r === 2 || r === 5) return { summary: '+1 Pierce, +20% Projectile Speed, +10% More Damage', mods: [{ stat: 'pierceCount', kind: 'flat', value: 1 }, { stat: 'projectileSpeed', kind: 'inc', value: 0.2 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      if (r === 4 || r === 7) return { summary: '+1 Arrow, +10% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+10% Crit Chance, +12% Armor Pen, +10% More Damage', mods: [{ stat: 'critChance', kind: 'flat', value: 0.1 }, { stat: 'armorPen', kind: 'flat', value: 0.12 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

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

    case 'arcane_missiles':
      if (r === 2 || r === 5 || r === 8) return { summary: '+2 Missiles, +8% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 2 }, { stat: 'damage', kind: 'more', value: 0.08 }] };
      return { summary: '+15% Cast Speed, +15% Projectile Speed, +10% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.15 }, { stat: 'projectileSpeed', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'shock_nova':
      if (r % 2 === 0) return { summary: '+18% Area, +25% Shock Chance, +10% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.18 }, { stat: 'shockChance', kind: 'flat', value: 0.25 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+16% Cooldown Recovery, +10% Lightning Pen, +10% More Damage', mods: [{ stat: 'cooldownRecovery', kind: 'inc', value: 0.16 }, { stat: 'lightningPen', kind: 'flat', value: 0.1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'heavy_strike':
      if (r % 2 === 0) return { summary: '+15% Armor Pen, +10% Crit Chance, +12% More Damage', mods: [{ stat: 'armorPen', kind: 'flat', value: 0.15 }, { stat: 'critChance', kind: 'flat', value: 0.1 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      return { summary: '+15% Attack Speed, +28% Crit Multi, +10% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.15 }, { stat: 'critMulti', kind: 'flat', value: 0.28 }, { stat: 'damage', kind: 'more', value: 0.1 }] };

    case 'molten_strike':
    case 'frost_blades':
    case 'lightning_strike':
      if (r === 3 || r === 6) return { summary: '+1 Strike Projectile, +12% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      if (r % 2 === 0) return { summary: '+16% Attack Speed, +15% Area, +10% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.16 }, { stat: 'area', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+8% Crit Chance, +20% Crit Multi, +12% More Damage', mods: [{ stat: 'critChance', kind: 'flat', value: 0.08 }, { stat: 'critMulti', kind: 'flat', value: 0.2 }, { stat: 'damage', kind: 'more', value: 0.12 }] };

    case 'ice_spear':
    case 'spark':
    case 'essence_drain':
    case 'soulrend':
      if (r === 3 || r === 6) return { summary: '+1 Projectile, +12% More Damage', mods: [{ stat: 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      if (r % 2 === 0) return { summary: '+18% Cast Speed, +1 Pierce, +10% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.18 }, { stat: 'pierceCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+15% Projectile Speed, +12% More Damage', mods: [{ stat: 'projectileSpeed', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.12 }] };

    case 'glacial_cascade':
    case 'ball_lightning':
    case 'blight_zone':
      if (r % 2 === 0) return { summary: '+20% Area, +12% Cooldown Recovery, +12% More Damage', mods: [{ stat: 'area', kind: 'inc', value: 0.2 }, { stat: 'cooldownRecovery', kind: 'inc', value: 0.12 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      return { summary: '+16% Cast Speed, +14% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.16 }, { stat: 'damage', kind: 'more', value: 0.14 }] };

    case 'rime_totem':
    case 'voltaic_sentry':
      if (r === 3 || r === 6) return { summary: '+1 Bolt/Chain, +12% More Damage', mods: [{ stat: artId === 'voltaic_sentry' ? 'chainCount' : 'projectileCount', kind: 'flat', value: 1 }, { stat: 'damage', kind: 'more', value: 0.12 }] };
      return { summary: '+18% Cast Speed, +12% More Damage', mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.18 }, { stat: 'damage', kind: 'more', value: 0.12 }] };

    case 'viper_strike':
      if (r % 2 === 0) return { summary: '+25% Poison Chance, +20% DoT Damage, +10% More Damage', mods: [{ stat: 'poisonChance', kind: 'flat', value: 0.25 }, { stat: 'dotDamage', kind: 'inc', value: 0.2 }, { stat: 'damage', kind: 'more', value: 0.1 }] };
      return { summary: '+18% Attack Speed, +15% Area, +12% More Damage', mods: [{ stat: 'attackSpeed', kind: 'inc', value: 0.18 }, { stat: 'area', kind: 'inc', value: 0.15 }, { stat: 'damage', kind: 'more', value: 0.12 }] };

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
