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

    // Since Cleave is full (2/2 Inscriptions), no Inscribe cards should be offered
    engine.openDraft();
    expect(engine.draftOptions.every((o) => o.card.category !== 'inscription')).toBe(true);

    // Add a second Art with open sockets, pick its Inscribe card, and verify the 'inscribe' phase
    const whirlwind = engine.addOrRankArt('whirlwind');
    engine.draftOptions = [
      {
        card: {
          id: 'inscribe_whirlwind',
          name: 'Inscribe: Whirlwind',
          category: 'inscription',
          rarity: 'rare',
          artId: 'whirlwind',
          description: 'Test',
          tags: ['attack', 'aoe', 'physical'],
        },
        summaryText: 'Etch Inscription',
      },
    ];
    engine.pickDraftOption(0);
    expect(engine.phase).toBe('inscribe');
    expect(engine.inscribeChoice?.artId).toBe('whirlwind');
    expect(engine.inscribeChoice?.options.length).toBeGreaterThan(0);
    const chosenId = engine.inscribeChoice!.options[0].ins.id;
    engine.pickInscription(chosenId);
    expect(engine.phase).toBe('playing');
    expect(whirlwind.inscriptions.some((i) => i.id === chosenId)).toBe(true);

    // Fill active Arts to MAX_ACTIVE_ARTS (4)
    engine.addOrRankArt('summon_skeleton');
    engine.addOrRankArt('fire_mine');
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

  it('keeps Inscriptions strictly local to their slotted Art and staggers Spell Echo', () => {
    const engine = new HollowWarEngine();
    engine.startRun('magician'); // starts with firebolt
    const frostbolt = engine.addOrRankArt('frostbolt');
    const baseFrostPreview = engine.getArtPreview(frostbolt);

    // Etch Spell Echo onto firebolt ONLY
    const firebolt = engine.arts[0];
    firebolt.inscriptions.push(INSCRIPTIONS.spell_echo);

    // Frostbolt must remain completely unaffected by firebolt's Spell Echo
    const afterFrostPreview = engine.getArtPreview(frostbolt);
    expect(afterFrostPreview.castsPerSecond).toBeCloseTo(baseFrostPreview.castsPerSecond, 4);
    expect(afterFrostPreview.estimatedDps).toBeCloseTo(baseFrostPreview.estimatedDps, 4);

    // Triggering firebolt should queue a staggered echo in pendingEchoes, then fire after 0.14s
    firebolt.cooldownTimer = 0;
    engine.update(0.05);
    expect(engine.pendingEchoes.length).toBe(1);
    const beforeEchoCount = engine.projectiles.length;
    engine.update(0.05);
    engine.update(0.05);
    engine.update(0.05);
    expect(engine.pendingEchoes.length).toBe(0);
    expect(engine.projectiles.length).toBeGreaterThan(beforeEchoCount);
  });

  it('filters irrelevant elemental Inscriptions and supports Inscribe Back + Reroll bad-luck protection', () => {
    const engine = new HollowWarEngine();
    engine.startRun('pyromancer'); // starts with Fireball (pure Fire)
    engine.openDraft();

    // Force an Inscribe choice for Fireball
    engine.draftOptions = [
      {
        card: {
          id: 'inscribe_fireball',
          name: 'Inscribe: Fireball',
          category: 'inscription',
          rarity: 'rare',
          artId: 'fireball',
          description: 'Test',
          tags: ['spell', 'projectile', 'aoe', 'fire'],
        },
        summaryText: 'Etch Inscription',
      },
    ];
    engine.pickDraftOption(0);
    expect(engine.phase).toBe('inscribe');

    const offeredIds = new Set(engine.inscribeChoice!.options.map((o) => o.ins.id));
    expect(offeredIds.has('hoarfrost_bind')).toBe(false);
    expect(offeredIds.has('voltaic_arc')).toBe(false);

    // Reroll in Inscribe should avoid repeating the exact same set
    engine.rerollInscribe();
    const rerolledIds = new Set(engine.inscribeChoice!.options.map((o) => o.ins.id));
    const allSame = [...offeredIds].every((id) => rerolledIds.has(id));
    expect(allSame).toBe(false);

    // Back button returns cleanly to draft
    engine.backFromInscribe();
    expect(engine.phase).toBe('draft');
  });

  it('has at least 6 Arts per archetype, deep Attack Inscriptions, and supports Archetype Focus', () => {
    const allArts = Object.values(ARTS);
    const archetypes = ['physical', 'fire', 'cold', 'lightning', 'chaos', 'attack'] as const;
    for (const arch of archetypes) {
      const count = allArts.filter((a) => a.tags.includes(arch)).length;
      expect(count).toBeGreaterThanOrEqual(6);
    }
    const constructCount = allArts.filter(
      (a) => a.tags.includes('minion') || a.tags.includes('totem') || a.tags.includes('trap'),
    ).length;
    expect(constructCount).toBeGreaterThanOrEqual(6);

    const engine = new HollowWarEngine();
    engine.startRun('warrior');
    engine.openDraft();
    engine.draftOptions = [
      {
        card: {
          id: 'art_arch_fire',
          name: 'Art: Fire',
          category: 'art_archetype',
          rarity: 'rare',
          archetype: 'fire',
          description: 'Choose a Fire Art.',
          tags: ['fire'],
        },
        summaryText: 'Art Tome',
      },
    ];
    engine.pickDraftOption(0);
    expect(engine.phase).toBe('art_select');
    expect(engine.artSelectChoice!.options.length).toBeGreaterThanOrEqual(1);
    expect(engine.artSelectChoice!.options.every((o) => o.artDef.tags.includes('fire'))).toBe(true);
    engine.backFromArtSelect();
    expect(engine.phase).toBe('draft');

    // Warrior starts with Cleave: verify deep Attack/Strike Inscription coverage
    const cleave = engine.arts.find((a) => a.artId === 'cleave')!;
    const compatible = engine.getCompatibleInscriptions(cleave).map((i) => i.id);
    expect(compatible).toContain('twin_strikes');
    expect(compatible).toContain('sweeping_arc');
    expect(compatible).toContain('aftershock');
    expect(compatible).toContain('razor_tempest');
    expect(compatible).toContain('phantom_reach');
    expect(compatible.length).toBeGreaterThanOrEqual(10);
  });

  it('supports timed Skeleton swarms, Minion Instability, and deep Minion Inscriptions', () => {
    const engine = new HollowWarEngine();
    engine.startRun('necromancer');
    engine.openDraft();
    engine.draftOptions = [
      {
        card: {
          id: 'art_summon_skeleton',
          name: 'Art: Summon Skeleton Warrior',
          category: 'art',
          rarity: 'rare',
          artId: 'summon_skeleton',
          description: '',
          tags: ['spell', 'minion', 'physical'],
        },
        summaryText: 'Art',
      },
    ];
    engine.pickDraftOption(0);
    engine.setPhase('playing');

    const skelArt = engine.arts.find((a) => a.artId === 'summon_skeleton')!;
    const compatible = engine.getCompatibleInscriptions(skelArt).map((i) => i.id);
    expect(compatible).toContain('volatile_thralls');
    expect(compatible).toContain('swarm_commander');
    expect(compatible).toContain('unholy_frenzy');
    expect(compatible).toContain('cleaving_thralls');
    expect(compatible).toContain('soul_tether');
    expect(compatible.length).toBeGreaterThanOrEqual(10);

    // Casting Summon Skeleton spawns 3 timed skeletons when cooldown completes
    skelArt.cooldownTimer = 0;
    engine.update(0.05);
    const spawned = engine.minions.filter((m) => m.artId === 'summon_skeleton');
    expect(spawned.length).toBe(3);
    expect(spawned[0].temporary).toBe(true);
    expect(spawned[0].life).toBeGreaterThan(8);
  });

  it('supports Shambling Horde zombies, Venom Fang thrust, Heavy Strike windup, Earthquake aftershock, and expanding Blighted Ground', () => {
    expect(ARTS.venom_fang.behavior).toBe('thrust');
    expect(ARTS.heavy_strike.behavior).toBe('thrust');
    expect(ARTS.heavy_strike.windupDelay).toBeGreaterThan(0.2);
    expect(ARTS.earthquake.innateAftershock).toBeDefined();
    expect(ARTS.shambling_horde.behavior).toBe('minion');

    const engine = new HollowWarEngine();
    engine.startRun('necromancer');
    for (const id of ['shambling_horde', 'blight_zone', 'venom_fang', 'earthquake']) {
      engine.openDraft();
      engine.draftOptions = [
        {
          card: {
            id: `art_${id}`,
            name: id,
            category: 'art',
            rarity: 'rare',
            artId: id,
            description: '',
            tags: ARTS[id].tags,
          },
          summaryText: 'Art',
        },
      ];
      engine.pickDraftOption(0);
    }
    engine.setPhase('playing');
    for (const a of engine.arts) a.cooldownTimer = 0;
    engine.update(0.05);

    const zombies = engine.minions.filter((m) => m.kind === 'zombie');
    expect(zombies.length).toBe(1);
    expect(engine.sweeps.some((s) => s.isThrust)).toBe(true);
    expect(engine.pendingAftershocks.some((a) => a.artId === 'earthquake')).toBe(true);

    const blight = engine.groundZones.find((gz) => gz.artId === 'blight_zone')!;
    expect(blight).toBeDefined();
    const initialR = blight.radius;
    engine.update(1.0);
    expect(blight.radius).toBeGreaterThan(initialR);
  });

  it('inherits projectile Inscriptions (Seeker homing) on projectile_nova Arts like Poison Nova', () => {
    const engine = new HollowWarEngine();
    engine.startRun('necromancer'); // starts with Poison Nova (projectile_nova)
    const pn = engine.arts.find((a) => a.artId === 'poison_nova')!;
    pn.inscriptions.push(INSCRIPTIONS.seeker);
    pn.cooldownTimer = 0;

    engine.update(0.05);
    const pnProjs = engine.projectiles.filter((p) => p.artId === 'poison_nova');
    expect(pnProjs.length).toBeGreaterThanOrEqual(6);
    expect(pnProjs.every((p) => p.homing === true)).toBe(true);
  });
});
