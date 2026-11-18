import { ARTS } from '../content/skills.ts';
import { VESSELS } from '../content/vessels.ts';
import type { HollowWarEngine } from '../game/engine.ts';

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
        <div class="modal-title">HOLLOW WAR</div>
        <div class="modal-subtitle">
          Step onto the Ashen Warfront against the Demon and Undead hosts. Choose a Hollow Wake class to shape your Arts, Inscriptions, Doctrines, and Oaths.
          <span style="color:#f59e0b">WASD / Arrows to move · Space / Shift to Dash · Q to toggle Aim · Tab for Build Inspector</span>
        </div>
        <div class="grid-3">
          ${VESSELS.map(
            (v) => `
            <div class="choice-card" data-vessel="${v.id}" style="border-color:${v.color}66">
              <div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${v.color}">${v.title}</div>
                <div style="font-size:18px;font-weight:800;margin:2px 0 8px">${v.name}</div>
                <div style="font-size:12px;color:#cbd5e1;line-height:1.45;margin-bottom:10px">${v.description}</div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">
                  Opening Art: <strong style="color:#f8fafc">${ARTS[v.startingArtId].name}</strong>
                </div>
                <div class="tag-row">
                  ${v.synergyHints.map((h) => `<span class="tag-pill">${h}</span>`).join('')}
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
    return;
  }

  if (engine.phase === 'draft') {
    container.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="modal-title">Level ${engine.player.level} — Forge Your Build</div>
          <button class="btn" id="btn-reroll" ${engine.player.rerolls <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
            Reroll (${engine.player.rerolls} left)
          </button>
        </div>
        <div class="modal-subtitle">
          Choose an Art, Inscription, Doctrine, or Keystone Oath. DPS deltas are simulated live on your forked StatSheet.
        </div>
        <div class="grid-3">
          ${engine.draftOptions
            .map((opt, idx) => {
              const { card, dpsDeltaPct, summaryText } = opt;
              const deltaHtml =
                dpsDeltaPct !== undefined && Math.abs(dpsDeltaPct) >= 0.5
                  ? `<span class="${dpsDeltaPct >= 0 ? 'delta-positive' : 'delta-negative'}">${dpsDeltaPct >= 0 ? '+' : ''}${dpsDeltaPct.toFixed(1)}% Est. DPS</span>`
                  : `<span style="font-size:12px;color:#94a3b8">Utility / Endurance</span>`;

              const rarityClass = card.rarity === 'oath' ? 'rarity-keystone' : `rarity-${card.rarity}`;

              return `
                <div class="choice-card ${rarityClass}" data-draft="${idx}">
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                      <span style="font-size:10px;font-weight:800;text-transform:uppercase;color:#f59e0b">${summaryText}</span>
                      <span style="font-size:10px;text-transform:uppercase;color:#94a3b8">${card.rarity}</span>
                    </div>
                    <div style="font-size:17px;font-weight:800;margin-bottom:8px">${card.name}</div>
                    <div style="font-size:13px;color:#e2e8f0;line-height:1.45;margin-bottom:10px">${card.description}</div>
                    ${card.tradeoff ? `<div class="tradeoff-box" style="margin-bottom:10px">Burden: ${card.tradeoff}</div>` : ''}
                    <div class="tag-row">
                      ${card.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(148,163,184,0.14);padding-top:10px;margin-top:6px">
                    ${deltaHtml}
                    <span style="font-size:12px;font-weight:700;color:#fbbf24">Claim →</span>
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
    container.querySelector('#btn-reroll')?.addEventListener('click', () => engine.rerollDraft());
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
          <button class="btn btn-primary" id="btn-resume">Resume [Tab / Esc]</button>
        </div>

        <div class="inspector-grid">
          <div class="inspector-panel">
            <h3>Arts & Inscriptions</h3>
            ${engine.arts
              .map((ar) => {
                const def = ARTS[ar.artId];
                const pv = engine.getArtPreview(ar);
                const types = Object.entries(pv.byType)
                  .filter(([, v]) => v > 0.5)
                  .map(([k, v]) => `${k}: ${v.toFixed(1)}`)
                  .join(' · ');
                return `
                  <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,0.12)">
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
                  </div>
                `;
              })
              .join('')}

            <h3 style="margin-top:12px">Conversions, Extra & Procs</h3>
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
        </div>
        <button class="btn btn-primary" id="btn-restart" style="width:100%;padding:12px;font-size:14px">
          Choose Class & Re-enter
        </button>
      </div>
    `;

    container.querySelector('#btn-restart')?.addEventListener('click', () => {
      engine.setPhase('vessel_select');
    });
  }
}
