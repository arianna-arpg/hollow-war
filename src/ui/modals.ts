import { ARTS, getArtRankStep, MAX_ACTIVE_ARTS } from '../content/skills.ts';
import { VESSELS } from '../content/vessels.ts';
import type { HollowWarEngine } from '../game/engine.ts';
import { ARCHIVE_NODES, buyArchiveNode, getNodeCost } from '../meta/archive.ts';

export function renderModal(
  container: HTMLElement,
  engine: HollowWarEngine,
  callbacks: {
    onCloseInspector: () => void;
  },
): void {
  if (engine.phase === 'playing') {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');

  if (engine.phase === 'vessel_select') {
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="modal-title">HOLLOW WAR</div>
          <button class="btn btn-primary" id="btn-open-archive">
            Barrow Archive · ${engine.archive.shards} Shards
          </button>
        </div>
        <div class="modal-subtitle">
          Step onto the Ashen Warfront against the Undead host and Demonic Incursion Portals. Choose a Hollow Wake class for its Opening Art and Ultimate.
          <span style="color:#f59e0b">WASD / Arrows to move · Space / Shift for Class Ultimate · Q to toggle Aim · Tab for Build Inspector</span>
        </div>
        <div class="grid-3">
          ${VESSELS.map(
            (v) => `
            <div class="choice-card" data-vessel="${v.id}" style="border-color:${v.color}66">
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${v.color}">${v.title}</div>
                <div style="font-size:18px;font-weight:800;margin:2px 0 8px">${v.name}</div>
                <div style="font-size:12px;color:#cbd5e1;line-height:1.45;margin-bottom:10px">${v.description}</div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">
                  Opening Art: <strong style="color:#f8fafc">${ARTS[v.startingArtId].name}</strong>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">
                  Ultimate: <strong style="color:${v.color}">${v.ultimate.name}</strong> — ${v.ultimate.description}
                </div>
              </div>
              <button class="btn btn-primary" style="width:100%;margin-top:8px">Enter the Warfront</button>
            </div>
          `,
          ).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-vessel]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.vessel!;
        engine.startRun(id);
      });
    });
    container.querySelector('#btn-open-archive')?.addEventListener('click', () => {
      engine.setPhase('archive');
    });
    return;
  }

  if (engine.phase === 'archive') {
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div>
            <div class="modal-title">The Barrow Archive</div>
            <div class="modal-subtitle" style="margin-bottom:0">
              Spend Hollow Shards earned from fallen Vessels to shape future runs, unlock Banishes, Rerolls, and Build Affinity.
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <span style="font-size:14px;font-weight:800;color:#fbbf24">${engine.archive.shards} Hollow Shards</span>
            <button class="btn" id="btn-archive-back">← Back</button>
          </div>
        </div>
        <div class="grid-3" style="margin-top:16px">
          ${ARCHIVE_NODES.map((node) => {
            const rank = engine.archive.ranks[node.id] ?? 0;
            const maxed = rank >= node.maxRank;
            const cost = getNodeCost(node, rank);
            const canAfford = !maxed && engine.archive.shards >= cost;
            return `
              <div class="choice-card" style="cursor:default">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:#f59e0b">Rank ${rank} / ${node.maxRank}</span>
                    <span style="font-size:11px;color:#94a3b8">${maxed ? 'MASTERED' : `${cost} Shards`}</span>
                  </div>
                  <div style="font-size:17px;font-weight:800;margin-bottom:8px">${node.name}</div>
                  <div style="font-size:13px;color:#cbd5e1;line-height:1.45">${node.description}</div>
                </div>
                <button class="btn ${canAfford ? 'btn-primary' : ''}" data-buy-node="${node.id}" ${!canAfford ? 'disabled style="opacity:0.45;cursor:not-allowed;width:100%"' : 'style="width:100%"'}>
                  ${maxed ? 'Mastered' : `Attune (${cost} Shards)`}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelector('#btn-archive-back')?.addEventListener('click', () => {
      engine.setPhase('vessel_select');
    });
    container.querySelectorAll<HTMLElement>('[data-buy-node]').forEach((el) => {
      el.addEventListener('click', () => {
        if (buyArchiveNode(engine.archive, el.dataset.buyNode!)) {
          engine.setPhase('archive');
        }
      });
    });
    return;
  }

  if (engine.phase === 'draft') {
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="modal-title">Level ${engine.player.level} — Forge Your Build</div>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:12px;color:#94a3b8">Banishes: <strong style="color:#f87171">${engine.player.banishes}</strong></span>
            <button class="btn" id="btn-reroll" ${engine.player.rerolls <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
              Reroll (${engine.player.rerolls} left)
            </button>
          </div>
        </div>
        <div class="modal-subtitle">
          Choose an Art Tome, Inscription, Passive, Conduit, or Keystone Oath. DPS deltas are simulated live on your forked StatSheet.
        </div>
        <div class="grid-3">
          ${engine.draftOptions
            .map((opt, idx) => {
              const { card, dpsDeltaPct, summaryText } = opt;
              const deltaHtml =
                card.category === 'inscription'
                  ? `<span style="font-size:12px;color:#38bdf8;font-weight:700">Choose from 4 Runes</span>`
                  : card.category === 'art_archetype'
                    ? `<span style="font-size:12px;color:#fbbf24;font-weight:700">Choose from 4 Arts</span>`
                    : card.category === 'passive_domain'
                      ? `<span style="font-size:12px;color:#86efac;font-weight:700">Choose from 4 Passives</span>`
                      : card.category === 'morph'
                        ? `<span style="font-size:12px;color:#e879f9;font-weight:700">2 Hollow Wake Routes</span>`
                        : dpsDeltaPct !== undefined && Math.abs(dpsDeltaPct) >= 0.5
                          ? `<span class="${dpsDeltaPct >= 0 ? 'delta-positive' : 'delta-negative'}">${dpsDeltaPct >= 0 ? '+' : ''}${dpsDeltaPct.toFixed(1)}% Est. DPS</span>`
                          : `<span style="font-size:12px;color:#94a3b8">Utility / Endurance</span>`;

              const rarityClass = card.rarity === 'oath' ? 'rarity-keystone' : `rarity-${card.rarity}`;
              const currentStacks = engine.acquiredCards.get(card.id) ?? 0;
              const rankBadge =
                card.category === 'passive' && card.maxStacks && card.maxStacks > 1
                  ? `<span style="font-size:11px;color:#93c5fd;margin-left:6px">(Rank ${currentStacks + 1}/${card.maxStacks})</span>`
                  : '';

              return `
                <div class="choice-card ${rarityClass}" data-draft="${idx}">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                      <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:#f59e0b">${summaryText}</span>
                      <div style="display:flex;gap:6px;align-items:center">
                        <span style="font-size:10px;text-transform:uppercase;color:#94a3b8">${card.rarity}</span>
                        ${engine.player.banishes > 0 ? `<button class="btn" data-banish="${idx}" style="padding:2px 6px;font-size:10px;color:#fca5a5;border-color:rgba(239,68,68,0.45)">Banish</button>` : ''}
                      </div>
                    </div>
                    <div style="font-size:17px;font-weight:800;margin-bottom:8px">${card.name}${rankBadge}</div>
                    ${
                      card.category === 'art' && card.artId && ARTS[card.artId]
                        ? `<div style="font-size:12px;color:#cbd5e1;line-height:1.45;margin-bottom:6px">${ARTS[card.artId].description}</div>
                           <div style="font-size:11px;color:#fbbf24;margin-bottom:10px">${
                             engine.arts.some((a) => a.artId === card.artId)
                               ? `Rank ${engine.arts.find((a) => a.artId === card.artId)!.level} → ${engine.arts.find((a) => a.artId === card.artId)!.level + 1}: ${getArtRankStep(card.artId, engine.arts.find((a) => a.artId === card.artId)!.level + 1).summary}`
                               : 'Learn new active Art'
                           }</div>`
                        : `<div style="font-size:13px;color:#e2e8f0;line-height:1.45;margin-bottom:10px">${card.description}</div>`
                    }
                    ${card.tradeoff ? `<div class="tradeoff-box" style="margin-bottom:10px">Burden: ${card.tradeoff}</div>` : ''}
                    <div class="tag-row">
                      ${card.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.14);padding-top:10px;margin-top:6px">
                    ${deltaHtml}
                    <span style="font-size:12px;font-weight:700;color:#fbbf24">${card.category === 'inscription' ? 'Select Rune →' : card.category === 'art_archetype' ? 'Select Art →' : card.category === 'passive_domain' ? 'Select Passive →' : card.category === 'morph' ? 'Morph Art →' : 'Claim →'}</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-draft]').forEach((el) => {
      el.addEventListener('click', () => {
        engine.pickDraftOption(Number(el.dataset.draft));
      });
    });
    container.querySelectorAll<HTMLElement>('[data-banish]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        engine.banishDraftOption(Number(el.dataset.banish));
      });
    });
    container.querySelector('#btn-reroll')?.addEventListener('click', () => engine.rerollDraft());
    return;
  }

  if (engine.phase === 'art_select' && engine.artSelectChoice) {
    const { label, options } = engine.artSelectChoice;
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="modal-title" style="color:#fbbf24">Select ${label} Art</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn" id="btn-art-back">← Back to Draft</button>
          </div>
        </div>
        <div class="modal-subtitle">
          Choose one ${label} Art to learn or deepen in rank.
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          ${options
            .map(({ artDef, isRankUp, nextRank, dpsDeltaPct }) => {
              const deltaHtml =
                Math.abs(dpsDeltaPct) >= 0.5
                  ? `<span class="${dpsDeltaPct >= 0 ? 'delta-positive' : 'delta-negative'}">${dpsDeltaPct >= 0 ? '+' : ''}${dpsDeltaPct.toFixed(1)}% Total DPS</span>`
                  : `<span style="font-size:12px;color:#94a3b8">New Tool</span>`;
              return `
                <div class="choice-card" data-art-pick="${artDef.id}" style="border-color:${artDef.color}66">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                      <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:${artDef.color}">${isRankUp ? `Rank ${nextRank - 1} → ${nextRank}` : `New Art (${engine.arts.length}/${MAX_ACTIVE_ARTS})`}</span>
                    </div>
                    <div style="font-size:16px;font-weight:800;margin-bottom:8px;color:${artDef.color}">${artDef.name}</div>
                    <div style="font-size:12px;color:#cbd5e1;line-height:1.45;margin-bottom:8px">${artDef.description}</div>
                    ${
                      isRankUp
                        ? `<div style="font-size:11px;color:#fbbf24;margin-bottom:10px">${getArtRankStep(artDef.id, nextRank).summary}</div>`
                        : ''
                    }
                    <div class="tag-row">
                      ${artDef.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.14);padding-top:10px;margin-top:6px">
                    ${deltaHtml}
                    <span style="font-size:12px;font-weight:700;color:${artDef.color}">${isRankUp ? 'Deepen →' : 'Learn →'}</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-art-pick]').forEach((el) => {
      el.addEventListener('click', () => {
        engine.pickArtChoice(el.dataset.artPick!);
      });
    });
    container.querySelector('#btn-art-back')?.addEventListener('click', () => engine.backFromArtSelect());
    return;
  }

  if (engine.phase === 'passive_select' && engine.passiveSelectChoice) {
    const { label, options } = engine.passiveSelectChoice;
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="modal-title" style="color:#86efac">Select ${label} Passive</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn" id="btn-passive-back">← Back to Draft</button>
          </div>
        </div>
        <div class="modal-subtitle">
          Choose one ${label} passive offering to bind to your build.
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          ${options
            .map(({ card, stacks, dpsDeltaPct }) => {
              const deltaHtml =
                Math.abs(dpsDeltaPct) >= 0.5
                  ? `<span class="${dpsDeltaPct >= 0 ? 'delta-positive' : 'delta-negative'}">${dpsDeltaPct >= 0 ? '+' : ''}${dpsDeltaPct.toFixed(1)}% Est. DPS</span>`
                  : `<span style="font-size:12px;color:#94a3b8">Utility / Endurance</span>`;
              const rankBadge =
                card.maxStacks && card.maxStacks > 1
                  ? `<span style="font-size:11px;color:#93c5fd;margin-left:6px">(Rank ${stacks + 1}/${card.maxStacks})</span>`
                  : '';
              return `
                <div class="choice-card rarity-${card.rarity}" data-passive-pick="${card.id}">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                      <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:#86efac">${label}</span>
                      <span style="font-size:10px;text-transform:uppercase;color:#94a3b8">${card.rarity}</span>
                    </div>
                    <div style="font-size:16px;font-weight:800;margin-bottom:8px">${card.name}${rankBadge}</div>
                    <div style="font-size:12px;color:#e2e8f0;line-height:1.45;margin-bottom:10px">${card.description}</div>
                    <div class="tag-row">
                      ${card.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.14);padding-top:10px;margin-top:6px">
                    ${deltaHtml}
                    <span style="font-size:12px;font-weight:700;color:#86efac">Bind →</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-passive-pick]').forEach((el) => {
      el.addEventListener('click', () => {
        engine.pickPassiveChoice(el.dataset.passivePick!);
      });
    });
    container.querySelector('#btn-passive-back')?.addEventListener('click', () => engine.backFromPassiveSelect());
    return;
  }

  if (engine.phase === 'art_morph' && engine.artMorphChoice) {
    const targetDef = ARTS[engine.artMorphChoice.artId];
    container.innerHTML = `
      <div class="modal-card">
        <div class="modal-title" style="color:#e879f9;margin-bottom:6px">Morph ${targetDef.name}</div>
        <div class="modal-subtitle">
          ${targetDef.name} has reached Rank Mastery! Choose one of two Hollow Wake evolutionary paths to permanently transform this Art.
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
          ${engine.artMorphChoice.routes
            .map(({ morph, dpsDeltaPct }) => {
              const deltaHtml =
                Math.abs(dpsDeltaPct) >= 0.5
                  ? `<span class="${dpsDeltaPct >= 0 ? 'delta-positive' : 'delta-negative'}">${dpsDeltaPct >= 0 ? '+' : ''}${dpsDeltaPct.toFixed(1)}% Art DPS</span>`
                  : `<span style="font-size:12px;color:#c084fc">Transformative Form</span>`;
              return `
                <div class="choice-card rarity-mythic" data-morph-pick="${morph.id}" style="border-color:${morph.color}99">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                      <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:${morph.color}">
                        ${morph.routeKind === 'theme' ? 'Path I · Perfected Discipline' : 'Path II · Radical Transformation'}
                      </span>
                    </div>
                    <div style="font-size:19px;font-weight:800;margin-bottom:8px;color:${morph.color}">${morph.name}</div>
                    <div style="font-size:13px;color:#e2e8f0;line-height:1.5;margin-bottom:12px">${morph.description}</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.14);padding-top:10px;margin-top:6px">
                    ${deltaHtml}
                    <span style="font-size:12px;font-weight:700;color:${morph.color}">Ascend →</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-morph-pick]').forEach((el) => {
      el.addEventListener('click', () => {
        engine.pickArtMorph(el.dataset.morphPick!);
      });
    });
    return;
  }

  if (engine.phase === 'inscribe' && engine.inscribeChoice) {
    const targetDef = ARTS[engine.inscribeChoice.artId];
    const targetArt = engine.arts.find((a) => a.artId === engine.inscribeChoice!.artId);
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="modal-title" style="color:${targetDef.color}">Inscribe ${targetDef.name}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn" id="btn-inscribe-back">← Back to Draft</button>
          </div>
        </div>
        <div class="modal-subtitle">
          Choose one compatible Inscription to embed into ${targetDef.name} (Rank ${targetArt?.level ?? 1}).
          ${targetArt?.inscriptions.length ? `Currently etched: ${targetArt.inscriptions.map((i) => i.shortName).join(', ')}` : ''}
        </div>
        <div class="grid-4">
          ${engine.inscribeChoice.options
            .map(({ ins, dpsDeltaPct }) => {
              const deltaHtml =
                Math.abs(dpsDeltaPct) >= 0.5
                  ? `<span class="${dpsDeltaPct >= 0 ? 'delta-positive' : 'delta-negative'}">${dpsDeltaPct >= 0 ? '+' : ''}${dpsDeltaPct.toFixed(1)}% Art DPS</span>`
                  : `<span style="font-size:12px;color:#94a3b8">Utility / Specialization</span>`;
              return `
                <div class="choice-card" data-inscribe="${ins.id}" style="border-color:${ins.color}66">
                  <div>
                    <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:${ins.color};margin-bottom:4px">Inscription</div>
                    <div style="font-size:16px;font-weight:800;margin-bottom:8px">${ins.name}</div>
                    <div style="font-size:12px;color:#e2e8f0;line-height:1.45">${ins.description}</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.14);padding-top:10px;margin-top:6px">
                    ${deltaHtml}
                    <span style="font-size:12px;font-weight:700;color:#fbbf24">Etch →</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-inscribe]').forEach((el) => {
      el.addEventListener('click', () => {
        engine.pickInscription(el.dataset.inscribe!);
      });
    });
    container.querySelector('#btn-inscribe-back')?.addEventListener('click', () => engine.backFromInscribe());
    return;
  }

  if (engine.phase === 'paused') {
    const conds = engine.sheet.getActiveConditions();
    const convs = engine.sheet.getAllConversions();
    const extras = engine.sheet.getAllExtras();
    const procs = engine.procs.list();

    const keyStats = [
      ['Maximum Life', Math.round(engine.sheet.get('life'))],
      ['Maximum Ward', Math.round(engine.sheet.get('ward'))],
      ['Armor', Math.round(engine.sheet.get('armor'))],
      ['Move Speed', Math.round(engine.sheet.get('moveSpeed'))],
      ['Cast Speed', `${(engine.sheet.get('castSpeed') * 100).toFixed(0)}%`],
      ['Attack Speed', `${(engine.sheet.get('attackSpeed') * 100).toFixed(0)}%`],
      ['Crit Chance', `${(engine.sheet.get('critChance') * 100).toFixed(1)}%`],
      ['Crit Multiplier', `${(engine.sheet.get('critMulti') * 100).toFixed(0)}%`],
      ['Area of Effect', `${(engine.sheet.get('area') * 100).toFixed(0)}%`],
      ['Projectile Speed', `${(engine.sheet.get('projectileSpeed') * 100).toFixed(0)}%`],
      ['Projectile Range', `${(engine.sheet.get('projectileDuration') * 100).toFixed(0)}%`],
      ['Extra Projectiles', Math.round(engine.sheet.get('projectileCount'))],
      ['Chain Count', Math.round(engine.sheet.get('chainCount'))],
      ['Ailment / DoT Mult', `${(engine.sheet.get('dotDamage') * 100).toFixed(0)}%`],
      ['Life Leech', `${(engine.sheet.get('lifeLeech') * 100).toFixed(1)}%`],
    ];

    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <div class="modal-title">Build & Arts Inspector — ${engine.vessel.name}</div>
            <div class="modal-subtitle" style="margin-bottom:0">
              Live Hollow Wake StatSheet · Active Conditions: ${conds.length ? conds.join(', ') : 'none'}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn" id="btn-end-run" style="color:#fca5a5;border-color:rgba(239,68,68,0.5)">End Run</button>
            <button class="btn btn-primary" id="btn-resume">Resume [Tab / Esc]</button>
          </div>
        </div>

        <div class="inspector-grid">
          <div class="inspector-panel">
            <h3>Class Ultimate ([Space] / [Shift])</h3>
            <div style="margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,0.12)">
              <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px">
                <span style="color:${engine.vessel.color}">${engine.vessel.ultimate.name}</span>
                <span style="color:#94a3b8">${engine.vessel.ultimate.cooldown}s Base CD</span>
              </div>
              <div style="font-size:12px;color:#cbd5e1;margin-top:3px">${engine.vessel.ultimate.description}</div>
            </div>

            <h3>Arts & Inscriptions (Hover for Details)</h3>
            ${engine.arts
              .map((ar) => {
                const def = ARTS[ar.artId];
                const pv = engine.getArtPreview(ar);
                const types = Object.entries(pv.byType)
                  .filter(([, v]) => v > 0.5)
                  .map(([k, v]) => `${k}: ${v.toFixed(1)}`)
                  .join(' · ');
                return `
                  <div class="hw-tooltip-wrap" style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,0.12);cursor:help">
                    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px">
                      <span style="color:${def.color}">${def.name} (Rank ${ar.level})</span>
                      <span>${Math.round(pv.estimatedDps)} DPS</span>
                    </div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px">
                      Avg Hit: ${pv.avgHit.toFixed(1)} · ${pv.castsPerSecond.toFixed(2)}/s · Crit ${(pv.critChance * 100).toFixed(0)}% (x${pv.critMulti.toFixed(2)})
                    </div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:2px">${types}</div>
                    ${
                      ar.inscriptions.length
                        ? `<div class="support-pips">${ar.inscriptions.map((ins) => `<span class="support-pip" style="color:${ins.color}">${ins.name}</span>`).join('')}</div>`
                        : ''
                    }
                    <div class="hw-tooltip hw-tooltip-down">
                      <div style="font-weight:800;color:${def.color};margin-bottom:3px">${def.name} (Rank ${ar.level})</div>
                      <div style="color:#cbd5e1;margin-bottom:6px">${def.description}</div>
                      <div class="tag-row" style="margin-bottom:4px">
                        ${def.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}
                      </div>
                      ${ar.inscriptions
                        .map(
                          (ins) =>
                            `<div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(148,163,184,0.16)"><strong style="color:${ins.color}">${ins.name}:</strong> ${ins.description}</div>`,
                        )
                        .join('')}
                    </div>
                  </div>
                `;
              })
              .join('')}

            <h3 style="margin-top:12px">Active Conversions, Extra & Procs</h3>
            ${convs.map((c) => `<div class="stat-line"><span>Convert ${c.from} → ${c.to}</span><span>${(c.ratio * 100).toFixed(0)}%</span></div>`).join('')}
            ${extras.map((e) => `<div class="stat-line"><span>Gain ${e.from} as Extra ${e.to}</span><span>${(e.ratio * 100).toFixed(0)}%</span></div>`).join('')}
            ${procs.map((p) => `<div class="stat-line"><span>Proc [${p.trigger}]: ${p.name}</span><span>${(p.chance * 100).toFixed(0)}% (${p.icd}s ICD)</span></div>`).join('')}
            ${!convs.length && !extras.length && !procs.length ? '<div style="font-size:12px;color:#94a3b8">No active conversions or procs yet.</div>' : ''}
          </div>

          <div class="inspector-panel">
            <h3>Live StatSheet</h3>
            ${keyStats.map(([label, val]) => `<div class="stat-line"><span>${label}</span><strong>${val}</strong></div>`).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-resume')?.addEventListener('click', callbacks.onCloseInspector);
    container.querySelector('#btn-end-run')?.addEventListener('click', () => engine.endRun());
    return;
  }

  if (engine.phase === 'game_over') {
    const mins = Math.floor(engine.elapsed / 60);
    const secs = Math.floor(engine.elapsed % 60)
      .toString()
      .padStart(2, '0');

    container.innerHTML = `
      <div class="modal-card" style="max-width:560px;text-align:center">
        <div class="modal-title" style="color:#ef4444">THE VESSEL FALLS</div>
        <div class="modal-subtitle">Your ${engine.vessel.name} was overwhelmed at Level ${engine.player.level}</div>
        <div class="inspector-panel" style="text-align:left;margin-bottom:18px">
          <div class="stat-line"><span>Time on the Warfront</span><strong>${mins}:${secs}</strong></div>
          <div class="stat-line"><span>Demons & Undead Slain</span><strong>${engine.kills}</strong></div>
          <div class="stat-line"><span>Total Damage Dealt</span><strong>${Math.round(engine.totalDamageDealt).toLocaleString()}</strong></div>
          <div class="stat-line"><span>Peak Estimated DPS</span><strong>${Math.round(engine.getTotalEstimatedDps())}</strong></div>
          <div class="stat-line"><span>Hollow Shards Earned</span><strong style="color:#fbbf24">+${engine.lastRunShards} (${engine.archive.shards} total)</strong></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn" id="btn-gameover-archive" style="flex:1;padding:12px;font-size:14px">
            Barrow Archive
          </button>
          <button class="btn btn-primary" id="btn-restart" style="flex:1;padding:12px;font-size:14px">
            Choose Class & Re-enter
          </button>
        </div>
      </div>
    `;

    container.querySelector('#btn-gameover-archive')?.addEventListener('click', () => {
      engine.setPhase('archive');
    });
    container.querySelector('#btn-restart')?.addEventListener('click', () => {
      engine.setPhase('vessel_select');
    });
  }
}
