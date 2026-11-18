import { StatRules } from '../sdk/stat-sheet.ts';

export const HOLLOW_WAR_STAT_RULES = new StatRules({
  // Core Vitals
  life: { label: 'Maximum Life', base: 100, min: 1 },
  lifeRegen: { label: 'Life Regen /s', base: 0.8, min: 0 },
  ward: { label: 'Maximum Ward', base: 0, min: 0 },
  wardRegen: { label: 'Ward Regen /s', base: 4, min: 0 },
  wardDelay: { label: 'Ward Recharge Delay', base: 2.5, min: 0.4 },
  armor: { label: 'Armor', base: 10, min: 0 },

  // Mobility & Utility
  moveSpeed: { label: 'Move Speed', base: 230, min: 80, max: 600 },
  pickupRadius: { label: 'Pickup Radius', base: 85, min: 30 },
  dashCooldown: { label: 'Dash Cooldown', base: 2.2, min: 0.5 },

  // Offense & Scaling
  damage: { label: 'Damage', base: 1, min: 0 },
  physicalDamage: { label: 'Physical Damage', base: 1, min: 0 },
  fireDamage: { label: 'Fire Damage', base: 1, min: 0 },
  coldDamage: { label: 'Cold Damage', base: 1, min: 0 },
  lightningDamage: { label: 'Lightning Damage', base: 1, min: 0 },
  chaosDamage: { label: 'Chaos Damage', base: 1, min: 0 },
  dotDamage: { label: 'Ailment / DoT Damage', base: 1, min: 0 },

  addedPhysical: { label: 'Added Physical', base: 0 },
  addedFire: { label: 'Added Fire', base: 0 },
  addedCold: { label: 'Added Cold', base: 0 },
  addedLightning: { label: 'Added Lightning', base: 0 },
  addedChaos: { label: 'Added Chaos', base: 0 },

  attackSpeed: { label: 'Attack Speed', base: 1, min: 0.2 },
  castSpeed: { label: 'Cast Speed', base: 1, min: 0.2 },
  cooldownRecovery: { label: 'Cooldown Recovery', base: 1, min: 0.25 },
  area: { label: 'Area of Effect', base: 1, min: 0.35 },

  projectileCount: { label: 'Extra Projectiles', base: 0, min: 0 },
  pierceCount: { label: 'Pierce Count', base: 0, min: 0 },
  chainCount: { label: 'Chain Count', base: 0, min: 0 },

  critChance: { label: 'Critical Strike Chance', base: 0.06, min: 0, max: 0.95, percent: true },
  critMulti: { label: 'Critical Strike Multiplier', base: 1.5, min: 1 },

  // Penetration
  armorPen: { label: 'Armor Penetration', base: 0, min: 0, max: 1, percent: true },
  firePen: { label: 'Fire Penetration', base: 0, percent: true },
  coldPen: { label: 'Cold Penetration', base: 0, percent: true },
  lightningPen: { label: 'Lightning Penetration', base: 0, percent: true },
  chaosPen: { label: 'Chaos Penetration', base: 0, percent: true },

  // Ailment Chances
  igniteChance: { label: 'Ignite Chance', base: 0.1, min: 0, max: 1, percent: true },
  bleedChance: { label: 'Bleed Chance', base: 0.1, min: 0, max: 1, percent: true },
  poisonChance: { label: 'Poison Chance', base: 0.1, min: 0, max: 1, percent: true },
  chillChance: { label: 'Chill Chance', base: 0.1, min: 0, max: 1, percent: true },
  shockChance: { label: 'Shock Chance', base: 0.1, min: 0, max: 1, percent: true },

  // Sustain
  lifeOnKill: { label: 'Life on Kill', base: 0, min: 0 },
  wardOnKill: { label: 'Ward on Kill', base: 0, min: 0 },
  lifeLeech: { label: 'Life Leech', base: 0, min: 0, max: 0.25, percent: true },
});
