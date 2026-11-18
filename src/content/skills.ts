import type { SkillDamageSpec } from '../sdk/combat-resolver.ts';
import type { ConversionRule, ExtraDamageRule, Modifier, SkillTag } from '../sdk/types.ts';

export type ArtBehavior = 'projectile' | 'chain' | 'orbit' | 'nova' | 'sweep';

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
