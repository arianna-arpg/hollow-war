import { describe, expect, it } from 'vitest';
import { HOLLOW_WAR_STAT_RULES } from '../src/content/stats.ts';
import { SKILLS } from '../src/content/skills.ts';
import { computeOutgoingByType, previewSkillDps, resolveHit } from '../src/sdk/combat-resolver.ts';
import { ProcRuntime } from '../src/sdk/proc-runtime.ts';
import { StatSheet } from '../src/sdk/stat-sheet.ts';

describe('Hollow War Combat SDK', () => {
  it('evaluates tag-scoped flat, inc, and multiplicative more modifiers', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    sheet.setSource('build', [
      { stat: 'damage', kind: 'inc', value: 0.5 },
      { stat: 'damage', kind: 'more', value: 0.2, tags: ['projectile'] },
      { stat: 'damage', kind: 'more', value: 0.3, tags: ['fire'] },
    ]);

    // Matching both ['projectile', 'fire'] gets both more multipliers: 1.5 * 1.2 * 1.3 = 2.34
    expect(sheet.get('damage', ['projectile', 'fire'])).toBeCloseTo(2.34, 4);
    // Only ['fire'] skips projectile more: 1.5 * 1.3 = 1.95
    expect(sheet.get('damage', ['fire'])).toBeCloseTo(1.95, 4);
  });

  it('gates conditional modifiers on actor conditions and isolates forked sheets', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    sheet.setSource('adrenaline', [
      { stat: 'attackSpeed', kind: 'inc', value: 0.4, when: 'lowLife' },
    ]);

    expect(sheet.get('attackSpeed')).toBeCloseTo(1.0, 4);
    sheet.setConditions(['lowLife']);
    expect(sheet.get('attackSpeed')).toBeCloseTo(1.4, 4);

    // Forking for a level-up preview must not mutate the live sheet
    const forked = sheet.fork();
    forked.setSource('preview', [{ stat: 'attackSpeed', kind: 'more', value: 0.25 }]);
    expect(forked.get('attackSpeed')).toBeCloseTo(1.75, 4);
    expect(sheet.get('attackSpeed')).toBeCloseTo(1.4, 4);
  });

  it('resolves conversions and gain-as-extra before elemental scaling', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    sheet.setConversions('ash', [{ from: 'physical', to: 'fire', ratio: 0.5 }]);
    sheet.setExtras('void', [{ from: 'fire', to: 'chaos', ratio: 0.25 }]);
    sheet.setSource('scaling', [
      { stat: 'fireDamage', kind: 'inc', value: 1.0 },
      { stat: 'chaosDamage', kind: 'inc', value: 0.5 },
    ]);

    const out = computeOutgoingByType(sheet, {
      baseDamage: { physical: 100 },
      baseCooldown: 1,
      tags: ['spell'],
    });

    // 100 phys -> 50 phys + 50 fire; gain 25% of 50 fire as extra chaos = 12.5 chaos
    // Scaled: phys = 50, fire = 50 * 2.0 = 100, chaos = 12.5 * 1.5 = 18.75
    expect(out.physical).toBeCloseTo(50, 3);
    expect(out.fire).toBeCloseTo(100, 3);
    expect(out.chaos).toBeCloseTo(18.75, 3);
  });

  it('enforces ProcRuntime ICD and max recursion depth', () => {
    const procs = new ProcRuntime();
    procs.register({
      id: 'coc',
      name: 'Cast on Crit',
      description: 'Test proc',
      trigger: 'onCrit',
      chance: 1.0,
      icd: 0.5,
      maxDepth: 1,
      effectId: 'fire_eruption',
    });

    let calls = 0;
    procs.emit('onCrit', 1.0, { x: 0, y: 0, depth: 0 }, () => {
      calls++;
    });
    // Blocked by ICD at t=1.2
    procs.emit('onCrit', 1.2, { x: 0, y: 0, depth: 0 }, () => {
      calls++;
    });
    // Ready again at t=1.6, but blocked if depth > maxDepth
    procs.emit('onCrit', 1.6, { x: 0, y: 0, depth: 2 }, () => {
      calls++;
    });
    procs.emit('onCrit', 1.6, { x: 0, y: 0, depth: 0 }, () => {
      calls++;
    });

    expect(calls).toBe(2);
  });

  it('computes skill DPS preview and hit resolution cleanly', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    const pv = previewSkillDps(sheet, SKILLS.firebolt, [], SKILLS.firebolt.baseProjectiles);
    expect(pv.estimatedDps).toBeGreaterThan(0);

    const hit = resolveHit(
      sheet,
      SKILLS.firebolt,
      { armor: 10, resistances: { fire: 0.1 } },
      () => 0.5,
    );
    expect(hit.totalDamage).toBeGreaterThan(0);
  });
});
