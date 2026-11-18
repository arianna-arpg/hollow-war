export type DamageType = 'physical' | 'fire' | 'cold' | 'lightning' | 'chaos';

export const DAMAGE_TYPES: readonly DamageType[] = [
  'physical',
  'fire',
  'cold',
  'lightning',
  'chaos',
] as const;

export type SkillTag =
  | 'attack'
  | 'spell'
  | 'projectile'
  | 'aoe'
  | 'nova'
  | 'orbit'
  | 'chain'
  | 'minion'
  | 'totem'
  | 'trap'
  | 'dot'
  | 'proc'
  | DamageType;

export type ConditionId =
  | 'lowLife'      // life <= 40% maxLife
  | 'fullLife'     // life >= 99% maxLife
  | 'warded'       // ward > 0
  | 'wardBroken'   // ward === 0 && maxWard > 0
  | 'moving'       // player velocity > threshold
  | 'stationary';  // player velocity <= threshold

export type ModifierKind = 'flat' | 'inc' | 'more' | 'override';

export interface Modifier {
  stat: string;
  kind: ModifierKind;
  value: number;
  /** If present, applies only when the queried tag context includes ALL of these tags. */
  tags?: readonly SkillTag[];
  /** If present, applies only when this actor condition is active. */
  when?: ConditionId;
  /** Optional label for UI/inspector provenance. */
  source?: string;
}

export interface StatRule {
  label: string;
  base: number;
  min?: number;
  max?: number;
  percent?: boolean;
  /** Optional description for the Theorycrafting Inspector. */
  description?: string;
}

export interface ConversionRule {
  from: DamageType;
  to: DamageType;
  ratio: number; // 0..1 (clamped so total outgoing conversion from one type <= 1)
  tags?: readonly SkillTag[];
  when?: ConditionId;
  source?: string;
}

export interface ExtraDamageRule {
  from: DamageType;
  to: DamageType;
  ratio: number; // e.g., 0.25 = gain 25% of `from` damage as extra `to` damage
  tags?: readonly SkillTag[];
  when?: ConditionId;
  source?: string;
}

export type ProcTrigger =
  | 'onHit'
  | 'onCrit'
  | 'onKill'
  | 'onDash'
  | 'onWardBreak'
  | 'onIgnite'
  | 'onTick';

export interface ProcSpec {
  id: string;
  name: string;
  description: string;
  trigger: ProcTrigger;
  chance: number;       // 0..1
  icd: number;          // internal cooldown in seconds
  maxDepth?: number;    // default 2 (prevents infinite proc loops)
  depthFalloff?: number;// multiplier on chance per depth (default 0.5)
  effectId: string;
  power?: number;
}

export type AilmentType = 'ignite' | 'bleed' | 'poison' | 'chill' | 'shock';

export interface HitReceipt {
  totalDamage: number;
  byType: Record<DamageType, number>;
  isCrit: boolean;
  appliedAilments: AilmentType[];
  killed: boolean;
}

export interface SkillDpsPreview {
  minHit: number;
  maxHit: number;
  avgHit: number;
  critChance: number;
  critMulti: number;
  castsPerSecond: number;
  projectilesOrHits: number;
  estimatedDps: number;
  byType: Record<DamageType, number>;
}
