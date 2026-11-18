import type { SkillDamageSpec } from '../sdk/combat-resolver.ts';
import type { ConversionRule, ExtraDamageRule, Modifier, SkillTag } from '../sdk/types.ts';

export const MAX_ACTIVE_ARTS = 4;
export const MAX_ART_RANK = 8;
export const MAX_INSCRIPTIONS_PER_ART = 2;

export type ArtBehavior = 'projectile' | 'chain' | 'orbit' | 'nova' | 'sweep' | 'minion' | 'totem' | 'trap';

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
      'Releases twin bolts of grave-violet ruin that eat into flesh with chaos and poison.',
    color: '#c084fc',
    behavior: 'projectile',
    baseDamage: { chaos: 22 },
    damageEffectiveness: 1.0,
    baseCooldown: 0.62,
    baseCritChance: 0.04,
    baseProjectiles: 2,
    baseRadius: 7,
    projectileSpeed: 500,
    tags: ['spell', 'projectile', 'chaos'],
  },
  poison_nova: {
    id: 'poison_nova',
    name: 'Poison Nova',
    description:
      'Exhales a ring of grave-miasma around your vessel, saturating nearby foes with stacking venom.',
    color: '#a855f7',
    behavior: 'nova',
    baseDamage: { chaos: 24 },
    damageEffectiveness: 1.1,
    baseCooldown: 1.28,
    baseCritChance: 0.02,
    baseProjectiles: 1,
    baseRadius: 148,
    tags: ['spell', 'aoe', 'nova', 'chaos'],
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
      'Pulses a sanctified ring of golden ember around you, scorching the wicked and the risen.',
    color: '#fbbf24',
    behavior: 'nova',
    baseDamage: { fire: 20, physical: 10 },
    damageEffectiveness: 1.15,
    baseCooldown: 1.35,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 158,
    tags: ['spell', 'aoe', 'nova', 'fire'],
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
  storm_totem: {
    id: 'storm_totem',
    name: 'Storm Totem',
    description:
      'Plants a runic lightning obelisk that periodically discharges Chain Lightning into nearby ranks.',
    color: '#38bdf8',
    behavior: 'totem',
    baseDamage: { lightning: 22 },
    damageEffectiveness: 0.9,
    baseCooldown: 3.4,
    baseCritChance: 0.04,
    baseProjectiles: 1,
    baseRadius: 210,
    baseChain: 2,
    tags: ['spell', 'totem', 'chain', 'lightning'],
  },
  cinder_trap: {
    id: 'cinder_trap',
    name: 'Cinder Trap',
    description:
      'Arms volatile ember sigils underfoot that erupt in a fiery blast when demons or undead cross them.',
    color: '#f43f5e',
    behavior: 'trap',
    baseDamage: { fire: 36, physical: 10 },
    damageEffectiveness: 1.25,
    baseCooldown: 1.45,
    baseCritChance: 0.06,
    baseProjectiles: 1,
    baseRadius: 105,
    tags: ['spell', 'trap', 'aoe', 'fire'],
  },
};

export const INSCRIPTIONS: Record<string, InscriptionDef> = {
  split_volley: {
    id: 'split_volley',
    name: 'Inscription of Split Volley',
    shortName: 'Split Volley',
    description: 'Etches a fractured flight path: +2 Projectiles, at the cost of 15% Less Projectile Damage.',
    color: '#fbbf24',
    requiredTags: ['projectile'],
    mods: [
      { stat: 'projectileCount', kind: 'flat', value: 2 },
      { stat: 'damage', kind: 'more', value: -0.15, tags: ['projectile'] },
    ],
  },
  combustion: {
    id: 'combustion',
    name: 'Inscription of Combustion',
    shortName: 'Combustion',
    description: 'Binds hungry cinder to the Art: +45% Ignite Chance, +25% More Fire Damage, +10% Fire Penetration.',
    color: '#f97316',
    mods: [
      { stat: 'igniteChance', kind: 'flat', value: 0.45 },
      { stat: 'fireDamage', kind: 'more', value: 0.25 },
      { stat: 'firePen', kind: 'flat', value: 0.1 },
    ],
  },
  forking_arc: {
    id: 'forking_arc',
    name: 'Inscription of Forking Arc',
    shortName: 'Forking Arc',
    description: 'Coaxes the current to leap further: +2 Chain Count and +15% Lightning Penetration.',
    color: '#38bdf8',
    requiredTags: ['chain'],
    mods: [
      { stat: 'chainCount', kind: 'flat', value: 2 },
      { stat: 'lightningPen', kind: 'flat', value: 0.15 },
    ],
  },
  void_infusion: {
    id: 'void_infusion',
    name: 'Inscription of Void Infusion',
    shortName: 'Void Infusion',
    description: 'Bleeds abyssal ruin into every strike: gain 25% of Physical & Elemental Damage as Extra Chaos.',
    color: '#c084fc',
    mods: [{ stat: 'poisonChance', kind: 'flat', value: 0.25 }],
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
    description: 'Compresses the blast inward: +35% More Area Damage, -15% Area of Effect.',
    color: '#f43f5e',
    requiredTags: ['aoe'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.35, tags: ['aoe'] },
      { stat: 'area', kind: 'inc', value: -0.15 },
    ],
  },
  spell_echo: {
    id: 'spell_echo',
    name: 'Inscription of Spell Echo',
    shortName: 'Spell Echo',
    description: 'Leaves a resonant afterimage: 40% chance to Echo the Art immediately and +12% Cast Speed.',
    color: '#818cf8',
    requiredTags: ['spell'],
    mods: [{ stat: 'castSpeed', kind: 'inc', value: 0.12 }],
    echoChance: 0.4,
  },
  crimson_leech: {
    id: 'crimson_leech',
    name: 'Inscription of Crimson Leech',
    shortName: 'Crimson Leech',
    description: 'Draws vitality from every wound: +4% Life Leech, +20% Bleed Chance, +18% More Damage on Full Life.',
    color: '#ef4444',
    mods: [
      { stat: 'lifeLeech', kind: 'flat', value: 0.04 },
      { stat: 'bleedChance', kind: 'flat', value: 0.2 },
      { stat: 'damage', kind: 'more', value: 0.18, when: 'fullLife' },
    ],
  },
  ruthless_precision: {
    id: 'ruthless_precision',
    name: 'Inscription of Ruthless Precision',
    shortName: 'Precision',
    description: 'Sharpens the Art to a lethal edge: +12% Base Crit Chance and +35% Crit Multiplier.',
    color: '#fde047',
    mods: [
      { stat: 'critChance', kind: 'flat', value: 0.12 },
      { stat: 'critMulti', kind: 'flat', value: 0.35 },
    ],
  },
};
