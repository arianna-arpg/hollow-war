import type {
  ConditionId,
  ConversionRule,
  DamageType,
  ExtraDamageRule,
  Modifier,
  SkillTag,
  StatRule,
} from './types.ts';

export class StatRules {
  readonly rules: ReadonlyMap<string, StatRule>;

  constructor(defs: Record<string, StatRule>) {
    this.rules = new Map(Object.entries(defs));
  }

  get(stat: string): StatRule | undefined {
    return this.rules.get(stat);
  }
}

/**
 * Tag-scoped, condition-aware StatSheet modeled after @hollow-wake/engine's StatSheet.
 * Formula: (base + sum(flat)) * (1 + sum(inc)) * prod(1 + more), clamped to [min, max].
 * Supports `fork()` for zero-side-effect level-up theorycrafting previews.
 */
export class StatSheet {
  private sources = new Map<string, Modifier[]>();
  private conversions = new Map<string, ConversionRule[]>();
  private extras = new Map<string, ExtraDamageRule[]>();
  private conditions = new Set<ConditionId>();
  private cache = new Map<string, number>();
  private generation = 0;

  constructor(readonly rules: StatRules) {}

  get revision(): number {
    return this.generation;
  }

  fork(): StatSheet {
    const copy = new StatSheet(this.rules);
    for (const [k, v] of this.sources) copy.sources.set(k, v.map((m) => ({ ...m })));
    for (const [k, v] of this.conversions) copy.conversions.set(k, v.map((c) => ({ ...c })));
    for (const [k, v] of this.extras) copy.extras.set(k, v.map((e) => ({ ...e })));
    copy.conditions = new Set(this.conditions);
    copy.generation = this.generation;
    return copy;
  }

  setSource(sourceId: string, mods: Modifier[]): void {
    this.sources.set(
      sourceId,
      mods.map((m) => ({ ...m, source: m.source ?? sourceId })),
    );
    this.invalidate();
  }

  removeSource(sourceId: string): void {
    if (this.sources.delete(sourceId)) {
      this.invalidate();
    }
  }

  setConversions(sourceId: string, rules: ConversionRule[]): void {
    this.conversions.set(
      sourceId,
      rules.map((r) => ({ ...r, source: r.source ?? sourceId })),
    );
    this.invalidate();
  }

  setExtras(sourceId: string, rules: ExtraDamageRule[]): void {
    this.extras.set(
      sourceId,
      rules.map((r) => ({ ...r, source: r.source ?? sourceId })),
    );
    this.invalidate();
  }

  setConditions(active: Iterable<ConditionId>): void {
    const next = new Set(active);
    if (next.size === this.conditions.size && [...next].every((c) => this.conditions.has(c))) {
      return;
    }
    this.conditions = next;
    this.invalidate();
  }

  hasCondition(id: ConditionId): boolean {
    return this.conditions.has(id);
  }

  getActiveConditions(): ConditionId[] {
    return [...this.conditions];
  }

  getAllModifiers(): Modifier[] {
    const out: Modifier[] = [];
    for (const list of this.sources.values()) {
      for (const m of list) out.push(m);
    }
    return out;
  }

  getAllConversions(): ConversionRule[] {
    const out: ConversionRule[] = [];
    for (const list of this.conversions.values()) {
      for (const c of list) out.push(c);
    }
    return out;
  }

  getAllExtras(): ExtraDamageRule[] {
    const out: ExtraDamageRule[] = [];
    for (const list of this.extras.values()) {
      for (const e of list) out.push(e);
    }
    return out;
  }

  get(stat: string, tags: readonly SkillTag[] = [], extraMods: readonly Modifier[] = []): number {
    const canCache = extraMods.length === 0;
    const key = canCache ? `${stat}|${tags.join(',')}` : '';
    if (canCache) {
      const cached = this.cache.get(key);
      if (cached !== undefined) return cached;
    }

    const rule = this.rules.get(stat);
    const base = rule?.base ?? 0;

    let flat = 0;
    let inc = 0;
    let more = 1;
    let overrideVal: number | undefined;

    const applyMod = (m: Modifier) => {
      if (m.stat !== stat) return;
      if (m.when && !this.conditions.has(m.when)) return;
      if (m.tags && m.tags.length > 0 && !m.tags.every((t) => tags.includes(t))) return;

      switch (m.kind) {
        case 'flat':
          flat += m.value;
          break;
        case 'inc':
          inc += m.value;
          break;
        case 'more':
          more *= 1 + m.value;
          break;
        case 'override':
          overrideVal = m.value;
          break;
      }
    };

    for (const list of this.sources.values()) {
      for (const m of list) applyMod(m);
    }
    for (const m of extraMods) applyMod(m);

    let result = overrideVal !== undefined ? overrideVal : (base + flat) * Math.max(0, 1 + inc) * Math.max(0, more);

    if (rule?.min !== undefined) result = Math.max(rule.min, result);
    if (rule?.max !== undefined) result = Math.min(rule.max, result);

    if (canCache) {
      this.cache.set(key, result);
    }
    return result;
  }

  /** Computes normalized conversion ratios per source DamageType (capped at 100% outgoing). */
  getConversionsFor(
    from: DamageType,
    tags: readonly SkillTag[],
  ): Array<{ to: DamageType; ratio: number }> {
    const buckets = new Map<DamageType, number>();
    let total = 0;

    for (const list of this.conversions.values()) {
      for (const c of list) {
        if (c.from !== from || c.ratio <= 0) continue;
        if (c.when && !this.conditions.has(c.when)) continue;
        if (c.tags && c.tags.length > 0 && !c.tags.every((t) => tags.includes(t))) continue;
        buckets.set(c.to, (buckets.get(c.to) ?? 0) + c.ratio);
        total += c.ratio;
      }
    }

    if (total <= 0) return [];
    const scale = total > 1 ? 1 / total : 1;
    return [...buckets.entries()].map(([to, ratio]) => ({ to, ratio: ratio * scale }));
  }

  getExtrasFor(from: DamageType, tags: readonly SkillTag[]): Array<{ to: DamageType; ratio: number }> {
    const out: Array<{ to: DamageType; ratio: number }> = [];
    for (const list of this.extras.values()) {
      for (const e of list) {
        if (e.from !== from || e.ratio <= 0) continue;
        if (e.when && !this.conditions.has(e.when)) continue;
        if (e.tags && e.tags.length > 0 && !e.tags.every((t) => tags.includes(t))) continue;
        out.push({ to: e.to, ratio: e.ratio });
      }
    }
    return out;
  }

  private invalidate(): void {
    this.generation++;
    this.cache.clear();
  }
}
