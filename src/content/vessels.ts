import type { ConversionRule, ExtraDamageRule, Modifier, ProcSpec } from '../sdk/types.ts';

export interface VesselDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  color: string;
  glowColor: string;
  startingSkillId: string;
  mods: Modifier[];
  conversions?: ConversionRule[];
  extras?: ExtraDamageRule[];
  procs?: ProcSpec[];
  synergyHints: string[];
}

export const VESSELS: VesselDefinition[] = [
  {
    id: 'ashbound',
    name: 'Ashbound Vessel',
    title: 'Ember Pyromancer',
    description:
      'Channels Hollow Wake flame. Converts Physical damage to Fire and proliferates Ignites when enemies fall.',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    startingSkillId: 'firebolt',
    mods: [
      { stat: 'fireDamage', kind: 'inc', value: 0.25 },
      { stat: 'igniteChance', kind: 'flat', value: 0.25 },
      { stat: 'dotDamage', kind: 'inc', value: 0.2 },
    ],
    conversions: [{ from: 'physical', to: 'fire', ratio: 0.35, source: 'Ashbound Core' }],
    procs: [
      {
        id: 'ashbound_prolif',
        name: 'Cinder Detonation',
        description: 'On Kill: 45% chance to erupt in a fiery blast dealing 28 Fire damage.',
        trigger: 'onKill',
        chance: 0.45,
        icd: 0.12,
        effectId: 'fire_eruption',
        power: 28,
      },
    ],
    synergyHints: ['Physical → Fire Conversion', 'Ignite Scaling', 'Kill-Chain Eruptions'],
  },
  {
    id: 'riftweaver',
    name: 'Riftweaver',
    title: 'Arcane Conduit',
    description:
      'High-velocity spellcaster with innate Ward, extra Chain targets, and Lightning-to-Chaos potential.',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    startingSkillId: 'arc_lash',
    mods: [
      { stat: 'life', kind: 'flat', value: -15 },
      { stat: 'ward', kind: 'flat', value: 45 },
      { stat: 'castSpeed', kind: 'inc', value: 0.22 },
      { stat: 'chainCount', kind: 'flat', value: 1 },
      { stat: 'damage', kind: 'more', value: 0.15, when: 'warded' },
    ],
    procs: [
      {
        id: 'rift_dash_arc',
        name: 'Slipstream Discharge',
        description: 'On Dash: Unleash an Arc Bolt at nearby enemies.',
        trigger: 'onDash',
        chance: 1.0,
        icd: 0.2,
        effectId: 'arc_discharge',
        power: 32,
      },
    ],
    synergyHints: ['Warded More Damage', 'Chain & Cast Speed', 'Dash-Cast Loops'],
  },
  {
    id: 'ironward',
    name: 'Ironward Bastion',
    title: 'Aegis Juggernaut',
    description:
      'Armored frontline hull. Converts incoming pressure into Ward-Break shockwaves and colossal Area blasts.',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    startingSkillId: 'ruin_nova',
    mods: [
      { stat: 'life', kind: 'flat', value: 40 },
      { stat: 'ward', kind: 'flat', value: 65 },
      { stat: 'armor', kind: 'flat', value: 25 },
      { stat: 'area', kind: 'inc', value: 0.25 },
      { stat: 'moveSpeed', kind: 'inc', value: -0.08 },
    ],
    procs: [
      {
        id: 'ironward_break_nova',
        name: 'Aegis Shatter',
        description: 'On Ward Break: Trigger a massive Ruin Shockwave for 65 Physical/Fire damage.',
        trigger: 'onWardBreak',
        chance: 1.0,
        icd: 1.0,
        effectId: 'ward_shockwave',
        power: 65,
      },
    ],
    synergyHints: ['Ward-Break Novas', 'Area & Armor Scaling', 'Tanky Brawler'],
  },
  {
    id: 'voidstalker',
    name: 'Voidstalker',
    title: 'Shadow Assassin',
    description:
      'Swift, lethal Vessel that thrives on Critical Strikes, stacking Poison, and Low-Life Adrenaline.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    startingSkillId: 'void_glaive',
    mods: [
      { stat: 'moveSpeed', kind: 'inc', value: 0.14 },
      { stat: 'critChance', kind: 'flat', value: 0.08 },
      { stat: 'critMulti', kind: 'flat', value: 0.35 },
      { stat: 'poisonChance', kind: 'flat', value: 0.3 },
      { stat: 'attackSpeed', kind: 'inc', value: 0.25, when: 'lowLife' },
    ],
    extras: [{ from: 'physical', to: 'chaos', ratio: 0.15, source: 'Voidstalker Edge' }],
    procs: [
      {
        id: 'void_crit_dart',
        name: 'Shadow Volley',
        description: 'On Crit: 35% chance to fire a homing Void Dart for 22 Chaos damage.',
        trigger: 'onCrit',
        chance: 0.35,
        icd: 0.18,
        effectId: 'void_dart',
        power: 22,
      },
    ],
    synergyHints: ['Crit-Proc Chains', 'Poison & Chaos Extra', 'Low-Life Adrenaline'],
  },
];
