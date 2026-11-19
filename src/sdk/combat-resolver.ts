import type { StatSheet } from './stat-sheet.ts';
import {
  DAMAGE_TYPES,
  type AilmentType,
  type ConversionRule,
  type DamageType,
  type ExtraDamageRule,
  type HitReceipt,
  type Modifier,
  type SkillDpsPreview,
  type SkillTag,
} from './types.ts';

export interface SkillDamageSpec {
  baseDamage: Partial<Record<DamageType, number>>;
  damageEffectiveness?: number; // multiplier on flat added damage (default 1)
  variance?: number;            // e.g. 0.15 => ±15% roll
  baseCooldown: number;         // seconds
  cooldownOnly?: boolean;       // scales only with cooldownRecovery, not cast/attack speed
  baseCritChance?: number;      // additive to sheet critChance
  tags: readonly SkillTag[];
}

export interface DefenderSpec {
  armor: number;
  resistances: Partial<Record<DamageType, number>>;
  damageTakenMult?: number; // e.g. 1.0 + shock bonus
}

const ARMOR_K = 5;

const TYPE_STAT_MAP: Record<DamageType, string> = {
  physical: 'physicalDamage',
  fire: 'fireDamage',
  cold: 'coldDamage',
  lightning: 'lightningDamage',
  chaos: 'chaosDamage',
};

const ADDED_STAT_MAP: Record<DamageType, string> = {
  physical: 'addedPhysical',
  fire: 'addedFire',
  cold: 'addedCold',
  lightning: 'addedLightning',
  chaos: 'addedChaos',
};

const PEN_STAT_MAP: Record<DamageType, string> = {
  physical: 'armorPen',
  fire: 'firePen',
  cold: 'coldPen',
  lightning: 'lightningPen',
  chaos: 'chaosPen',
};

/**
 * Computes pre-mitigation damage per DamageType for a given skill & attacker StatSheet,
 * faithfully modeling Hollow Wake's conversion -> gain-as-extra -> tag-scoped scaling pipeline.
 */
export function computeOutgoingByType(
  sheet: StatSheet,
  spec: SkillDamageSpec,
  extraMods: readonly Modifier[] = [],
  extraConversions: readonly ConversionRule[] = [],
  extraExtras: readonly ExtraDamageRule[] = [],
): Record<DamageType, number> {
  const eff = spec.damageEffectiveness ?? 1;
  const raw: Record<DamageType, number> = {
    physical: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    chaos: 0,
  };

  for (const dt of DAMAGE_TYPES) {
    const base = spec.baseDamage[dt] ?? 0;
    const added = sheet.get(ADDED_STAT_MAP[dt], spec.tags, extraMods) * eff;
    raw[dt] = Math.max(0, base + added);
  }

  // Step 1: Elemental/Damage Conversions (sheet + per-Art Inscription conversions)
  const converted: Record<DamageType, number> = {
    physical: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    chaos: 0,
  };
  for (const dt of DAMAGE_TYPES) {
    const amount = raw[dt];
    if (amount <= 0) continue;
    const sheetConvs = sheet.getConversionsFor(dt, spec.tags);
    const localConvs = extraConversions
      .filter((c) => c.from === dt && c.ratio > 0 && (!c.when || sheet.hasCondition(c.when)))
      .map((c) => ({ to: c.to, ratio: c.ratio }));
    const allConvs = [...sheetConvs, ...localConvs];
    const totalRatio = allConvs.reduce((s, c) => s + c.ratio, 0);
    const scale = totalRatio > 1 ? 1 / totalRatio : 1;

    let used = 0;
    for (const c of allConvs) {
      const r = c.ratio * scale;
      converted[c.to] += amount * r;
      used += r;
    }
    converted[dt] += amount * Math.max(0, 1 - used);
  }

  // Step 2: Gain % as Extra Damage (sheet + per-Art Inscription extras)
  const withExtra: Record<DamageType, number> = { ...converted };
  for (const dt of DAMAGE_TYPES) {
    const amount = converted[dt];
    if (amount <= 0) continue;
    const extras = [
      ...sheet.getExtrasFor(dt, spec.tags),
      ...extraExtras
        .filter((e) => e.from === dt && e.ratio > 0 && (!e.when || sheet.hasCondition(e.when)))
        .map((e) => ({ to: e.to, ratio: e.ratio })),
    ];
    for (const ex of extras) {
      withExtra[ex.to] += amount * ex.ratio;
    }
  }

  // Step 3: Apply global `damage` multiplier + per-element multiplier
  const globalMult = sheet.get('damage', spec.tags, extraMods);
  const out: Record<DamageType, number> = {
    physical: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    chaos: 0,
  };

  for (const dt of DAMAGE_TYPES) {
    if (withExtra[dt] <= 0) continue;
    const typeTags: SkillTag[] = spec.tags.includes(dt) ? [...spec.tags] : [...spec.tags, dt];
    const typeMult = sheet.get(TYPE_STAT_MAP[dt], typeTags, extraMods);
    out[dt] = withExtra[dt] * globalMult * typeMult;
  }

  return out;
}

export function resolveHit(
  sheet: StatSheet,
  spec: SkillDamageSpec,
  defender: DefenderSpec,
  rng: () => number = Math.random,
  extraMods: readonly Modifier[] = [],
  extraConversions: readonly ConversionRule[] = [],
  extraExtras: readonly ExtraDamageRule[] = [],
): Omit<HitReceipt, 'killed'> {
  const outgoing = computeOutgoingByType(sheet, spec, extraMods, extraConversions, extraExtras);
  const variance = spec.variance ?? 0.12;
  const roll = 1 + (rng() * 2 - 1) * variance;

  const critChance = Math.min(0.95, Math.max(0, sheet.get('critChance', spec.tags, extraMods) + (spec.baseCritChance ?? 0)));
  const critMulti = Math.max(1, sheet.get('critMulti', spec.tags, extraMods));
  const isCrit = rng() < critChance;
  const critFactor = isCrit ? critMulti : 1;

  const taken = defender.damageTakenMult ?? 1;
  const byType: Record<DamageType, number> = {
    physical: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    chaos: 0,
  };

  let totalDamage = 0;

  for (const dt of DAMAGE_TYPES) {
    let dmg = outgoing[dt] * roll * critFactor;
    if (dmg <= 0) continue;

    if (dt === 'physical') {
      const pen = Math.min(1, Math.max(0, sheet.get(PEN_STAT_MAP.physical, spec.tags, extraMods)));
      const armor = Math.max(0, defender.armor * (1 - pen));
      const mit = Math.max(0.15, (ARMOR_K * dmg) / (armor + ARMOR_K * dmg));
      dmg *= mit;
    } else {
      const pen = sheet.get(PEN_STAT_MAP[dt], spec.tags, extraMods);
      const baseRes = defender.resistances[dt] ?? 0;
      const effRes = Math.max(-0.5, Math.min(0.75, baseRes - pen));
      dmg *= 1 - effRes;
    }

    dmg *= taken;
    byType[dt] = dmg;
    totalDamage += dmg;
  }

  // Ailment application rolls
  const appliedAilments: AilmentType[] = [];
  if (byType.fire > 0.5) {
    const chance = sheet.get('igniteChance', spec.tags, extraMods) + (isCrit ? 0.25 : 0);
    if (rng() < chance) appliedAilments.push('ignite');
  }
  if (byType.physical > 0.5) {
    const chance = sheet.get('bleedChance', spec.tags, extraMods);
    if (rng() < chance) appliedAilments.push('bleed');
  }
  if (byType.chaos > 0.5) {
    const chance = sheet.get('poisonChance', spec.tags, extraMods);
    if (rng() < chance) appliedAilments.push('poison');
  }
  if (byType.cold > 0.5) {
    const chance = sheet.get('chillChance', spec.tags, extraMods) + 0.35; // cold naturally chills often
    if (rng() < chance) appliedAilments.push('chill');
  }
  if (byType.lightning > 0.5) {
    const chance = sheet.get('shockChance', spec.tags, extraMods) + (isCrit ? 0.35 : 0);
    if (rng() < chance) appliedAilments.push('shock');
  }

  return {
    totalDamage,
    byType,
    isCrit,
    appliedAilments,
  };
}

export function previewSkillDps(
  sheet: StatSheet,
  spec: SkillDamageSpec,
  extraMods: readonly Modifier[] = [],
  baseProjectiles = 1,
  extraConversions: readonly ConversionRule[] = [],
  extraExtras: readonly ExtraDamageRule[] = [],
  echoMultiplier = 1,
): SkillDpsPreview {
  const byType = computeOutgoingByType(sheet, spec, extraMods, extraConversions, extraExtras);
  const rawAvg = DAMAGE_TYPES.reduce((sum, dt) => sum + byType[dt], 0);
  const variance = spec.variance ?? 0.12;

  const critChance = Math.min(0.95, Math.max(0, sheet.get('critChance', spec.tags, extraMods) + (spec.baseCritChance ?? 0)));
  const critMulti = Math.max(1, sheet.get('critMulti', spec.tags, extraMods));
  const avgCritFactor = 1 + critChance * (critMulti - 1);

  const speedStat = spec.tags.includes('attack') ? 'attackSpeed' : 'castSpeed';
  const speed = Math.max(0.1, sheet.get(speedStat, spec.tags, extraMods));
  const cdr = Math.max(0.2, sheet.get('cooldownRecovery', spec.tags, extraMods));
  const effectiveCooldown = spec.baseCooldown / (spec.cooldownOnly ? cdr : speed * cdr);
  const castsPerSecond = 1 / Math.max(0.08, effectiveCooldown);

  const projBonus = spec.tags.includes('projectile')
    ? Math.max(0, Math.round(sheet.get('projectileCount', spec.tags, extraMods)))
    : 0;
  const projectilesOrHits = baseProjectiles + projBonus;

  const avgHit = rawAvg * avgCritFactor;
  const estimatedDps = avgHit * castsPerSecond * projectilesOrHits * echoMultiplier;

  return {
    minHit: rawAvg * (1 - variance),
    maxHit: rawAvg * (1 + variance) * critMulti,
    avgHit,
    critChance,
    critMulti,
    castsPerSecond,
    projectilesOrHits,
    estimatedDps,
    byType,
  };
}
