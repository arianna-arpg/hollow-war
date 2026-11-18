import type { ConversionRule, ExtraDamageRule, Modifier, ProcSpec, SkillTag } from '../sdk/types.ts';

export type UpgradeRarity = 'common' | 'rare' | 'mythic' | 'oath';
export type UpgradeCategory = 'art' | 'inscription' | 'doctrine' | 'oath';

export interface UpgradeCardDef {
  id: string;
  name: string;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  description: string;
  tags: readonly SkillTag[];
  maxStacks?: number;
  /** For category === 'art' */
  artId?: string;
  /** For category === 'inscription' */
  inscriptionId?: string;
  /** Modifiers applied to the player StatSheet */
  mods?: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  procs?: ProcSpec[];
  /** Optional trade-off note shown on Keystone Oaths */
  tradeoff?: string;
}

export const UPGRADE_POOL: UpgradeCardDef[] = [
  // === ARTS (Acquire a new Art or deepen its mastery for +22% More Damage) ===
  {
    id: 'art_firebolt',
    name: 'Art: Firebolt',
    category: 'art',
    rarity: 'rare',
    artId: 'firebolt',
    description: 'Master Firebolt (or deepen its rank for +22% More Art Damage).',
    tags: ['spell', 'projectile', 'fire'],
  },
  {
    id: 'art_cleave',
    name: 'Art: Cleave',
    category: 'art',
    rarity: 'rare',
    artId: 'cleave',
    description: 'Master Cleave (or deepen its rank for +22% More Art Damage & +12% Area).',
    tags: ['attack', 'aoe', 'physical'],
  },
  {
    id: 'art_fan_of_blades',
    name: 'Art: Fan of Blades',
    category: 'art',
    rarity: 'rare',
    artId: 'fan_of_blades',
    description: 'Master Fan of Blades (or deepen its rank for +1 Dagger & +22% More Art Damage).',
    tags: ['attack', 'projectile', 'physical'],
  },
  {
    id: 'art_poison_nova',
    name: 'Art: Poison Nova',
    category: 'art',
    rarity: 'rare',
    artId: 'poison_nova',
    description: 'Master Poison Nova (or deepen its rank for +22% More Art Damage & +12% Area).',
    tags: ['spell', 'aoe', 'nova', 'chaos'],
  },
  {
    id: 'art_chain_lightning',
    name: 'Art: Chain Lightning',
    category: 'art',
    rarity: 'rare',
    artId: 'chain_lightning',
    description: 'Master Chain Lightning (or deepen its rank for +1 Chain & +22% More Art Damage).',
    tags: ['spell', 'chain', 'lightning'],
  },
  {
    id: 'art_hammer_of_judgment',
    name: 'Art: Hammer of Judgment',
    category: 'art',
    rarity: 'rare',
    artId: 'hammer_of_judgment',
    description: 'Master Hammer of Judgment (or add +1 Orbiting Hammer & +22% More Art Damage).',
    tags: ['attack', 'orbit', 'physical', 'fire'],
  },
  {
    id: 'art_frost_nova',
    name: 'Art: Frost Nova',
    category: 'art',
    rarity: 'rare',
    artId: 'frost_nova',
    description: 'Master Frost Nova (or deepen its rank for +22% More Art Damage & +12% Area).',
    tags: ['spell', 'aoe', 'nova', 'cold'],
  },

  // === INSCRIPTIONS (Bind directly onto a compatible Art) ===
  {
    id: 'ins_split_volley',
    name: 'Inscription of Split Volley',
    category: 'inscription',
    rarity: 'rare',
    inscriptionId: 'split_volley',
    description: 'Etch onto a Projectile Art: +2 Projectiles, at the cost of 15% Less Projectile Damage.',
    tags: ['projectile'],
  },
  {
    id: 'ins_combustion',
    name: 'Inscription of Combustion',
    category: 'inscription',
    rarity: 'rare',
    inscriptionId: 'combustion',
    description: 'Etch onto any Art: +45% Ignite Chance, +25% More Fire Damage, +10% Fire Penetration.',
    tags: ['fire', 'dot'],
  },
  {
    id: 'ins_forking_arc',
    name: 'Inscription of Forking Arc',
    category: 'inscription',
    rarity: 'rare',
    inscriptionId: 'forking_arc',
    description: 'Etch onto a Chain Art: +2 Chain Count and +15% Lightning Penetration.',
    tags: ['chain', 'lightning'],
  },
  {
    id: 'ins_void_infusion',
    name: 'Inscription of Void Infusion',
    category: 'inscription',
    rarity: 'mythic',
    inscriptionId: 'void_infusion',
    description: 'Etch onto any Art: Gain 25% of Physical & Elemental Damage as Extra Chaos.',
    tags: ['chaos'],
  },
  {
    id: 'ins_concentrated_core',
    name: 'Inscription of Concentrated Core',
    category: 'inscription',
    rarity: 'rare',
    inscriptionId: 'concentrated_core',
    description: 'Etch onto an Area Art: +35% More Area Damage, -15% Area of Effect.',
    tags: ['aoe'],
  },
  {
    id: 'ins_spell_echo',
    name: 'Inscription of Spell Echo',
    category: 'inscription',
    rarity: 'mythic',
    inscriptionId: 'spell_echo',
    description: 'Etch onto a Spell Art: 40% chance to Echo immediately, +12% Cast Speed.',
    tags: ['spell'],
  },
  {
    id: 'ins_crimson_leech',
    name: 'Inscription of Crimson Leech',
    category: 'inscription',
    rarity: 'rare',
    inscriptionId: 'crimson_leech',
    description: 'Etch onto any Art: +4% Life Leech, +20% Bleed Chance, +18% More Damage on Full Life.',
    tags: ['physical'],
  },
  {
    id: 'ins_ruthless_precision',
    name: 'Inscription of Ruthless Precision',
    category: 'inscription',
    rarity: 'rare',
    inscriptionId: 'ruthless_precision',
    description: 'Etch onto any Art: +12% Base Crit Chance and +35% Crit Multiplier.',
    tags: ['attack', 'spell'],
  },

  // === DOCTRINES & CONDUITS ===
  {
    id: 'doc_ember_forged',
    name: 'Doctrine of the Furnace',
    category: 'doctrine',
    rarity: 'common',
    maxStacks: 3,
    description: 'Kindles every strike with lingering ash: +25% Fire Damage and +12 Added Fire Damage.',
    tags: ['fire'],
    mods: [
      { stat: 'fireDamage', kind: 'inc', value: 0.25 },
      { stat: 'addedFire', kind: 'flat', value: 12 },
    ],
  },
  {
    id: 'doc_arcane_velocity',
    name: 'Doctrine of Alacrity',
    category: 'doctrine',
    rarity: 'common',
    maxStacks: 3,
    description: 'Sharpens your cadence in the fray: +18% Cast Speed, +15% Attack Speed, +8% Move Speed.',
    tags: ['spell', 'attack'],
    mods: [
      { stat: 'castSpeed', kind: 'inc', value: 0.18 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.15 },
      { stat: 'moveSpeed', kind: 'inc', value: 0.08 },
    ],
  },
  {
    id: 'doc_glacial_reservoir',
    name: 'Conduit: Glacial Reservoir',
    category: 'doctrine',
    rarity: 'common',
    maxStacks: 3,
    description: 'Draws winter stillness into your Aegis: +45 Maximum Ward, +5 Ward Regen/s, +15% Cold Damage.',
    tags: ['cold'],
    mods: [
      { stat: 'ward', kind: 'flat', value: 45 },
      { stat: 'wardRegen', kind: 'flat', value: 5 },
      { stat: 'coldDamage', kind: 'inc', value: 0.15 },
    ],
  },
  {
    id: 'doc_vital_bastion',
    name: 'Doctrine of Iron Marrow',
    category: 'doctrine',
    rarity: 'common',
    maxStacks: 3,
    description: 'Hardens bone and mail alike: +35 Maximum Life, +1.5 Life Regen/s, +15 Armor.',
    tags: [],
    mods: [
      { stat: 'life', kind: 'flat', value: 35 },
      { stat: 'lifeRegen', kind: 'flat', value: 1.5 },
      { stat: 'armor', kind: 'flat', value: 15 },
    ],
  },
  {
    id: 'doc_piercing_salvo',
    name: 'Doctrine of the Longbow',
    category: 'doctrine',
    rarity: 'rare',
    maxStacks: 2,
    description: 'Teaches projectiles to punch through ranks: +1 Pierce, +1 Extra Projectile, +15% Projectile Damage.',
    tags: ['projectile'],
    mods: [
      { stat: 'pierceCount', kind: 'flat', value: 1 },
      { stat: 'projectileCount', kind: 'flat', value: 1 },
      { stat: 'damage', kind: 'inc', value: 0.15, tags: ['projectile'] },
    ],
  },
  {
    id: 'doc_avatar_of_ash',
    name: 'Conduit: Avatar of Ash',
    category: 'doctrine',
    rarity: 'mythic',
    maxStacks: 1,
    description: 'Turns steel and frost alike to cinder: convert 50% of Physical & Cold to Fire, and gain 15% of Fire as Extra Chaos.',
    tags: ['fire', 'chaos'],
    conversions: [
      { from: 'physical', to: 'fire', ratio: 0.5 },
      { from: 'cold', to: 'fire', ratio: 0.5 },
    ],
    extras: [{ from: 'fire', to: 'chaos', ratio: 0.15 }],
  },
  {
    id: 'doc_cast_on_crit',
    name: 'Conduit: Spark on Precision',
    category: 'doctrine',
    rarity: 'mythic',
    maxStacks: 1,
    description: 'Every critical strike answers with flame: 55% chance on Crit to loose a homing Firebolt (0.2s ICD).',
    tags: ['proc', 'fire', 'spell'],
    procs: [
      {
        id: 'proc_coc_firebolt',
        name: 'Spark on Precision: Firebolt',
        description: 'Fires a homing Firebolt on Critical Strike.',
        trigger: 'onCrit',
        chance: 0.55,
        icd: 0.2,
        effectId: 'coc_firebolt',
        power: 30,
      },
    ],
  },
  {
    id: 'doc_kinetic_dynamo',
    name: 'Conduit: Kinetic Dynamo',
    category: 'doctrine',
    rarity: 'rare',
    maxStacks: 1,
    description: 'While Moving: +25% More Damage and +15% Crit Chance. While Stationary: +30 Armor.',
    tags: [],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.25, when: 'moving' },
      { stat: 'critChance', kind: 'flat', value: 0.15, when: 'moving' },
      { stat: 'armor', kind: 'flat', value: 30, when: 'stationary' },
    ],
  },
  {
    id: 'doc_toxic_catalyst',
    name: 'Doctrine of the Plague-Bearer',
    category: 'doctrine',
    rarity: 'rare',
    maxStacks: 2,
    description: 'Deepens every lingering affliction: +35% Ailment/DoT Damage, +25% Poison & Bleed Chance, +10% Chaos Pen.',
    tags: ['dot', 'chaos', 'physical'],
    mods: [
      { stat: 'dotDamage', kind: 'inc', value: 0.35 },
      { stat: 'poisonChance', kind: 'flat', value: 0.25 },
      { stat: 'bleedChance', kind: 'flat', value: 0.25 },
      { stat: 'chaosPen', kind: 'flat', value: 0.1 },
    ],
  },
  {
    id: 'doc_soul_siphon',
    name: 'Doctrine of the Barrow',
    category: 'doctrine',
    rarity: 'common',
    maxStacks: 2,
    description: 'Gathers the spilled essence of the fallen: +2 Life on Kill, +4 Ward on Kill, +25 Pickup Radius.',
    tags: [],
    mods: [
      { stat: 'lifeOnKill', kind: 'flat', value: 2 },
      { stat: 'wardOnKill', kind: 'flat', value: 4 },
      { stat: 'pickupRadius', kind: 'flat', value: 25 },
    ],
  },

  // === KEYSTONE OATHS (Build-defining mutators) ===
  {
    id: 'oath_glass_spire',
    name: 'Oath of the Glass Spire',
    category: 'oath',
    rarity: 'oath',
    maxStacks: 1,
    description: 'Forsake endurance for pure lethality: +60% More Global Damage and +15% Crit Chance.',
    tradeoff: '-40% Maximum Life and -20 Armor.',
    tags: [],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.6 },
      { stat: 'critChance', kind: 'flat', value: 0.15 },
      { stat: 'life', kind: 'more', value: -0.4 },
      { stat: 'armor', kind: 'flat', value: -20 },
    ],
  },
  {
    id: 'oath_crimson_pact',
    name: 'Oath of the Crimson Pact',
    category: 'oath',
    rarity: 'oath',
    maxStacks: 1,
    description: 'Bind your spells to living blood: +45% More Spell Damage and +8% Life Leech.',
    tradeoff: 'Maximum Ward becomes 0.',
    tags: ['spell'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.45, tags: ['spell'] },
      { stat: 'lifeLeech', kind: 'flat', value: 0.08 },
      { stat: 'ward', kind: 'override', value: 0 },
    ],
  },
  {
    id: 'oath_pyromania',
    name: 'Oath of the Cinder-Crown',
    category: 'oath',
    rarity: 'oath',
    maxStacks: 1,
    description: 'Let the burn outlive the blow: +100% Ignite Chance, +55% More Ailment/DoT Damage, +30% Area.',
    tradeoff: '-25% Direct Hit Damage.',
    tags: ['fire', 'dot'],
    mods: [
      { stat: 'igniteChance', kind: 'flat', value: 1.0 },
      { stat: 'dotDamage', kind: 'more', value: 0.55 },
      { stat: 'area', kind: 'inc', value: 0.3 },
      { stat: 'damage', kind: 'more', value: -0.25 },
    ],
  },
  {
    id: 'oath_static_overload',
    name: 'Oath of Static Overload',
    category: 'oath',
    rarity: 'oath',
    maxStacks: 1,
    description: 'Surrender breadth for voltage: +35% More Lightning Damage, +2 Chain Count, +40% Shock Chance.',
    tradeoff: '-35% Area of Effect.',
    tags: ['lightning', 'chain'],
    mods: [
      { stat: 'lightningDamage', kind: 'more', value: 0.35 },
      { stat: 'chainCount', kind: 'flat', value: 2 },
      { stat: 'shockChance', kind: 'flat', value: 0.4 },
      { stat: 'area', kind: 'more', value: -0.35 },
    ],
  },
  {
    id: 'oath_singularity',
    name: 'Oath of the Singularity',
    category: 'oath',
    rarity: 'oath',
    maxStacks: 1,
    description: 'Anchor yourself as the eye of the storm: +50% More Orbit & Area Damage, +45% Area of Effect.',
    tradeoff: '-25% Move Speed and -20% Projectile Damage.',
    tags: ['orbit', 'aoe'],
    mods: [
      { stat: 'damage', kind: 'more', value: 0.5, tags: ['orbit'] },
      { stat: 'damage', kind: 'more', value: 0.5, tags: ['aoe'] },
      { stat: 'area', kind: 'inc', value: 0.45 },
      { stat: 'moveSpeed', kind: 'inc', value: -0.25 },
      { stat: 'damage', kind: 'more', value: -0.2, tags: ['projectile'] },
    ],
  },
];
