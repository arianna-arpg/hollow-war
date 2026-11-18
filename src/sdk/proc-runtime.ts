import type { ProcSpec, ProcTrigger } from './types.ts';

export interface ProcEventContext {
  x: number;
  y: number;
  targetId?: number;
  damage?: number;
  depth?: number;
}

export type ProcExecutor = (spec: ProcSpec, ctx: ProcEventContext) => void;

/**
 * ProcRuntime modeled after @hollow-wake/engine's ProcRuntime:
 * Enforces Internal Cooldowns (ICD), max recursion depth, and depth chance falloff
 * so emergent proc chains (e.g. Crit -> Firebolt -> Ignite -> Nova) feel explosive
 * without ever causing infinite loops.
 */
export class ProcRuntime {
  private specs = new Map<string, ProcSpec>();
  private readyAt = new Map<string, number>();

  register(spec: ProcSpec): void {
    this.specs.set(spec.id, spec);
  }

  unregister(id: string): void {
    this.specs.delete(id);
    this.readyAt.delete(id);
  }

  clear(): void {
    this.specs.clear();
    this.readyAt.clear();
  }

  list(): ProcSpec[] {
    return [...this.specs.values()];
  }

  emit(
    trigger: ProcTrigger,
    now: number,
    ctx: ProcEventContext,
    execute: ProcExecutor,
    rng: () => number = Math.random,
  ): number {
    const depth = ctx.depth ?? 0;
    let fired = 0;

    for (const spec of this.specs.values()) {
      if (spec.trigger !== trigger) continue;
      const maxDepth = spec.maxDepth ?? 2;
      if (depth > maxDepth) continue;

      const ready = this.readyAt.get(spec.id) ?? 0;
      if (now < ready) continue;

      const falloff = Math.pow(spec.depthFalloff ?? 0.5, depth);
      const effectiveChance = Math.min(1, spec.chance * falloff);
      if (rng() > effectiveChance) continue;

      this.readyAt.set(spec.id, now + spec.icd);
      execute(spec, { ...ctx, depth: depth + 1 });
      fired++;
    }

    return fired;
  }
}
