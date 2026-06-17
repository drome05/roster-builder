function genCombos() {
  const size    = CFG.rosterSize;
  const combos  = [];
  const players = allPlayersWithPLT();
  if (players.length < size) return combos;

  function combine(start, current) {
    if (current.length === size) {
      const total        = current.reduce((s, p) => s + p.mmr, 0);
      const valid        = total <= CFG.cap;
      const hasPLT       = current.some(p => p.isPLT);
      const statsPlayers = current.filter(p => p.acs != null && p.kd != null);
      const hasStats     = statsPlayers.length > 0;
      const avgAcs  = hasStats ? statsPlayers.reduce((s, p) => s + p.acs, 0) / statsPlayers.length : 0;
      const avgKd   = hasStats ? statsPlayers.reduce((s, p) => s + p.kd,  0) / statsPlayers.length : 0;
      const score   = avgAcs * 0.6 + avgKd * 50 * 0.4;
      const names    = current.map(p => p.name);
      const duoCount    = DUOS.filter(d => names.includes(d.a) && names.includes(d.b)).length;
      const badDuoCount = BAD_DUOS.filter(d => names.includes(d.a) && names.includes(d.b)).length;
      const duoBoost = duoCount;
      combos.push({ team: [...current], total, valid, rem: CFG.cap - total, avgAcs, avgKd, score, duoBoost, badDuoCount, hasPLT, hasStats });
      return;
    }
    for (let i = start; i < players.length; i++) {
      combine(i + 1, [...current, players[i]]);
    }
  }
  combine(0, []);
  return combos;
}

function getValidCombos() {
  return genCombos().filter(c => {
    if (!c.valid) return false;
    // Every locked player must be in the combo
    for (const name of LOCKED_PLAYERS) {
      if (!c.team.some(p => p.name === name)) return false;
    }
    return true;
  }).sort((a, b) => a.rem - b.rem);
}

function grade(score, min, max) {
  if (max === min) return { c: 's-b', l: 'B' };
  const pct = (score - min) / (max - min);
  if (pct >= 0.75) return { c: 's-s', l: 'S' };
  if (pct >= 0.45) return { c: 's-a', l: 'A' };
  if (pct >= 0.20) return { c: 's-b', l: 'B' };
  return { c: 's-c', l: 'C' };
}


// ═══════════════════════════════════════════════════════════════
//  VALORANT AGENTS  (role-based image selection)
// ═══════════════════════════════════════════════════════════════
const AGENT_BY_ROLE = {
  DUELIST: ['jett', 'phoenix', 'reyna', 'raze', 'neon', 'yoru'],
  CTRL:    ['brimstone', 'viper', 'omen', 'astra', 'harbor'],
  SENTI:   ['sage', 'cypher', 'kj', 'chamber'],
  INI:     ['sova', 'breach', 'skye', 'kayo', 'fade'],
  FLEX:    ['jett', 'reyna', 'omen', 'sage', 'sova', 'viper', 'breach'],
};
const AGENT_ALL = ['jett','phoenix','reyna','raze','neon','yoru','brimstone','viper','omen','astra','harbor','sage','cypher','kj','chamber','sova','breach','skye','kayo','fade'];

function getAgentForPlayer(name, role) {
  const pool = AGENT_BY_ROLE[role] || AGENT_ALL;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) | 0;
  return pool[Math.abs(hash) % pool.length];
}

// ═══════════════════════════════════════════════════════════════
//  BUILDER
// ═══════════════════════════════════════════════════════════════
function buildGrid() {
  const grid  = document.getElementById('roster-grid');
  const empty = document.getElementById('builder-empty');

  if (!PLAYERS.length && !PROMO_PLAYERS.length) {
    grid.innerHTML     = '';
    grid.style.display = 'none';
    empty.style.display = 'block';
    updateCap();
    return;
  }

  grid.style.display  = 'grid';
  empty.style.display = 'none';

  const pool         = allPlayersWithPLT();
  const currentTotal = [...selected].reduce((s, n) => {
    const p = pool.find(x => x.name === n);
    return s + (p?.mmr || 0);
  }, 0);

  grid.innerHTML = pool.map((p, i) => {
    const isSel       = selected.has(p.name);
    const wouldTotal  = currentTotal + (isSel ? 0 : p.mmr);
    const wouldOver   = !isSel && selected.size >= CFG.rosterSize;
    const wouldCapOver = !isSel && wouldTotal > CFG.cap;
    const isDisabled  = !isSel && (wouldOver || wouldCapOver);

    let cls = '';
    if      (p.isPLT && isSel) cls = 'selected bde-active';
    else if (p.isPLT)          cls = 'plt-card' + (isDisabled ? ' disabled' : '');
    else if (isSel)            cls = 'selected';
    else if (isDisabled)       cls = 'disabled';

    const nameDisplay = p.isPLT ? (p.label || 'Promo Player') : p.name;
    const roleDisplay = p.isPLT ? 'PROMO' : (p.role || '—');
    const roleColor   = ROLE_COLORS[p.role] || 'var(--muted)';
    const agentFile   = getAgentForPlayer(p.name, p.role);

    return `<div class="player-card ${cls}" style="animation-delay:${i * 35}ms;--card-role-color:${p.isPLT ? 'var(--gold)' : roleColor}" onclick="handleCardClick('${p.name.replace(/'/g, "\\'")}')">
      <div class="card-agent-header">
        <img class="agent-img${p.isPLT ? ' agent-img-plt' : ''}" src="agents/${agentFile}.png" alt="${agentFile}" loading="lazy">
        ${p.isPLT ? '<span class="plt-badge">PLT</span>' : ''}
      </div>
      <div class="card-body">
        <p class="pname" style="${p.isPLT ? 'color:var(--gold)' : ''}">${nameDisplay}</p>
        <div class="card-footer">
          <span class="pmmr">${p.mmr} <span style="font-size:9px;opacity:.5">MMR</span></span>
          <span class="prole" style="color:${p.isPLT ? 'var(--gold)' : roleColor}">${roleDisplay}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  updateCap();
}

function handleCardClick(name) {
  const pool = allPlayersWithPLT();
  const p    = pool.find(x => x.name === name);
  if (!p) return;

  if (selected.has(name)) {
    selected.delete(name);
  } else {
    if (selected.size >= CFG.rosterSize) return;
    const addTotal = [...selected].reduce((s, n) => {
      const pl = pool.find(x => x.name === n);
      return s + (pl?.mmr || 0);
    }, 0) + p.mmr;
    if (addTotal <= CFG.cap) selected.add(name);
  }
  buildGrid();
}

// Animates a numeric element from its current displayed value to `target`
function animateNum(el, target, duration = 320) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target;
    return;
  }
  const from = parseInt(el.textContent, 10) || 0;
  if (from === target) return;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3); // ease-out-cubic
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(from + (target - from) * ease(p));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateCap() {
  const pool  = allPlayersWithPLT();
  const total = [...selected].reduce((s, n) => {
    const p = pool.find(x => x.name === n);
    return s + (p?.mmr || 0);
  }, 0);
  const rem = CFG.cap - total;
  const pct = (total / CFG.cap) * 100;
  const col = pct >= 100 ? '#C07070' : pct >= 95 ? '#BA7517' : pct >= 85 ? '#FBBF24' : 'var(--green)';

  const usedEl = document.getElementById('cap-used');
  const remEl  = document.getElementById('cap-rem');
  animateNum(usedEl, total || 0);
  usedEl.style.color = pct >= 100 ? '#C07070' : 'var(--text)';
  if (total) animateNum(remEl, rem);
  else remEl.textContent = '—';
  remEl.style.color = rem < 0 ? '#C07070' : rem <= 20 ? '#FBBF24' : 'var(--text)';
  document.getElementById('cap-count').textContent = `${selected.size}/${CFG.rosterSize}`;
  document.getElementById('cap-fill').style.transform = 'scaleX(' + Math.min(1, (pct || 0) / 100) + ')';
  document.getElementById('cap-fill').style.background = col;

  const status = document.getElementById('cap-status');
  const isValid = selected.size === CFG.rosterSize && total <= CFG.cap;
  const discordBtn = document.getElementById('discord-copy-btn');
  if (discordBtn) discordBtn.style.display = isValid ? 'block' : 'none';

  if (total > CFG.cap) {
    status.textContent = '✗ Over cap';   status.style.color = '#C07070';
  } else if (selected.size === CFG.rosterSize && total <= CFG.cap) {
    status.textContent = '✓ Valid roster'; status.style.color = 'var(--green)';
  } else if (!selected.size) {
    status.textContent = '—';            status.style.color = 'var(--muted)';
  } else {
    status.textContent = `Need ${CFG.rosterSize - selected.size} more`; status.style.color = 'var(--muted)';
  }

  const names = [...selected].map(n => {
    const p = pool.find(x => x.name === n);
    const lbl = p?.isPLT ? (p.label || 'Promo Player') : n;
    return `${lbl} (${p?.mmr || 0})`;
  });
  document.getElementById('sel-display').textContent = names.length ? names.join(' · ') : 'No players selected';
}


// ═══════════════════════════════════════════════════════════════
//  ALL COMBOS
