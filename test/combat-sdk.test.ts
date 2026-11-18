import { describe, expect, it } from 'vitest';
import { ARTS, INSCRIPTIONS, MAX_ACTIVE_ARTS, MAX_INSCRIPTIONS_PER_ART } from '../src/content/skills.ts';
import { HOLLOW_WAR_STAT_RULES } from '../src/content/stats.ts';
import { HollowWarEngine } from '../src/game/engine.ts';
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

    expect(sheet.get('damage', ['projectile', 'fire'])).toBeCloseTo(2.34, 4);
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

    expect(out.physical).toBeCloseTo(50, 3);
    expect(out.fire).toBeCloseTo(100, 3);
    expect(out.chaos).toBeCloseTo(18.75, 3);
  });

  it('enforces ProcRuntime ICD and max recursion depth', () => {
    const procs = new ProcRuntime();
    procs.register({
      id: 'coc',
      name: 'Spark on Precision',
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
    procs.emit('onCrit', 1.2, { x: 0, y: 0, depth: 0 }, () => {
      calls++;
    });
    procs.emit('onCrit', 1.6, { x: 0, y: 0, depth: 2 }, () => {
      calls++;
    });
    procs.emit('onCrit', 1.6, { x: 0, y: 0, depth: 0 }, () => {
      calls++;
    });

    expect(calls).toBe(2);
  });

  it('computes Art DPS preview and hit resolution cleanly', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    const pv = previewSkillDps(sheet, ARTS.firebolt, [], ARTS.firebolt.baseProjectiles);
    expect(pv.estimatedDps).toBeGreaterThan(0);

    const hit = resolveHit(
      sheet,
      ARTS.cleave,
      { armor: 10, resistances: {} },
      () => 0.5,
    );
    expect(hit.totalDamage).toBeGreaterThan(0);
  });

  it('applies Spell Echo cast speed downside and doublecast multiplier accurately', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    const base = previewSkillDps(sheet, ARTS.firebolt, [], ARTS.firebolt.baseProjectiles);
    const echo = INSCRIPTIONS.spell_echo;
    const echoed = previewSkillDps(
      sheet,
      ARTS.firebolt,
      echo.mods,
      ARTS.firebolt.baseProjectiles,
      [],
      [],
      1 + (echo.echoChance ?? 0),
    );

    // Casts per second drops by 28%, but 2x echo yields 1.44x net DPS
    expect(echoed.castsPerSecond).toBeCloseTo(base.castsPerSecond * 0.72, 3);
    expect(echoed.estimatedDps).toBeCloseTo(base.estimatedDps * 0.72 * 2, 2);
  });

  it('applies Void Infusion per-Art extra chaos through full chaos scaling', () => {
    const sheet = new StatSheet(HOLLOW_WAR_STAT_RULES);
    sheet.setSource('chaos_scale', [{ stat: 'chaosDamage', kind: 'inc', value: 1.0 }]);
    const voidInf = INSCRIPTIONS.void_infusion;
    const out = computeOutgoingByType(sheet, ARTS.firebolt, voidInf.mods, [], voidInf.extras ?? []);

    // Firebolt base: 22 fire + 6 phys = 28; 25% gained as extra chaos = 7, scaled by +100% chaosDamage = 14
    expect(out.chaos).toBeCloseTo(14, 3);
  });

  it('enforces Art cap (4), Inscription cap (2), and Inscription compatibility in drafts', () => {
    const engine = new HollowWarEngine();
    engine.startRun('warrior'); // starts with Cleave (attack, aoe, physical)
    expect(engine.arts.length).toBe(1);

    // Etch 2 compatible Inscriptions onto Cleave
    engine.arts[0].inscriptions.push(INSCRIPTIONS.concentrated_core, INSCRIPTIONS.crimson_leech);
    expect(engine.arts[0].inscriptions.length).toBe(MAX_INSCRIPTIONS_PER_ART);

    // Since Cleave is full (2/2 Inscriptions), no Inscription cards should be offered
    engine.openDraft();
    expect(engine.draftOptions.every((o) => o.card.category !== 'inscription')).toBe(true);

    // Fill active Arts to MAX_ACTIVE_ARTS (4)
    engine.addOrRankArt('whirlwind');
    engine.addOrRankArt('raise_skeleton');
    engine.addOrRankArt('cinder_trap');
    expect(engine.arts.length).toBe(MAX_ACTIVE_ARTS);

    // Unlearned Arts must not be offered once 4 Arts are active
    engine.openDraft();
    const activeIds = new Set(engine.arts.map((a) => a.artId));
    for (const opt of engine.draftOptions) {
      if (opt.card.category === 'art' && opt.card.artId) {
        expect(activeIds.has(opt.card.artId)).toBe(true);
      }
    }
  });
});
