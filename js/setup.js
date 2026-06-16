function togglePromoFlex(show) {
  const el = document.getElementById('promo-flex-checklist');
  if (el) el.classList.toggle('visible', show);
  if (!show) resetFlexPills('promo-flex-checklist');
}

function addPromoPlayer() {
  const nameInput = document.getElementById('promo-name-input');
  const mmrInput  = document.getElementById('promo-mmr-input');
  const roleVal   = document.getElementById('promo-role-val').value || '—';
  let flexRoles   = null;
  if (roleVal === 'FLEX') flexRoles = getFlexRoles('promo-flex-checklist');

  const label = nameInput.value.trim() || `Promo Player ${_promoIdSeq}`;
  const mmr   = parseInt(mmrInput.value) || 145;
  const id    = '__PLT__' + (_promoIdSeq++);

  PROMO_PLAYERS.push({ id, label, mmr, role: roleVal, flexRoles });

  nameInput.value = '';
  mmrInput.value  = '';
  pickGenericRole('promo-role-val', 'promo-role-label', '', 'promo-role-menu');
  togglePromoFlex(false);

  renderPromoList();
  refreshBuilderPLTBar();
}

function removePromoPlayer(id) {
  PROMO_PLAYERS = PROMO_PLAYERS.filter(p => p.id !== id);
  selected.delete(id);
  renderPromoList();
  refreshBuilderPLTBar();
  buildGrid();
}

function renderPromoList() {
  autoSave();
  const container = document.getElementById('promo-entry-list');
  const emptyMsg  = document.getElementById('promo-empty-msg');

  if (!PROMO_PLAYERS.length) {
    container.innerHTML = '<p class="promo-empty" id="promo-empty-msg">No promo players added yet.</p>';
    return;
  }

  container.innerHTML = PROMO_PLAYERS.map(p => `
    <div class="promo-entry">
      <span class="pe-label">${esc(p.label)}</span>
      <span class="pe-mmr">${p.mmr} MMR</span>
      <span class="pe-role" style="color:${ROLE_COLORS[p.role]||'var(--muted)'};font-family:'DM Mono',monospace;font-size:11px">${p.role && p.role !== '—' ? (ROLE_LABELS[p.role]||p.role) : '—'}</span>
      <span class="pe-del" onclick="removePromoPlayer('${p.id}')" title="Remove">✕</span>
    </div>
  `).join('');
}

function refreshBuilderPLTBar() {
  const bar = document.getElementById('bde-box');
  const display = document.getElementById('bde-mmr-live-display');

  if (!PROMO_PLAYERS.length) {
    display.innerHTML = '<span style="color:var(--muted)">No promo players configured · edit in Setup</span>';
    bar.style.borderColor = 'var(--border)';
    return;
  }

  bar.style.borderColor = 'var(--gold-mid)';
  display.innerHTML = PROMO_PLAYERS
    .map(p => `<span><strong style="color:var(--gold)">${esc(p.label)}</strong> · ${p.mmr} MMR</span>`)
    .join('<span style="color:var(--border2);margin:0 6px">|</span>');
  display.style.display = 'flex';
  display.style.flexWrap = 'wrap';
  display.style.gap = '6px';
}

function allPlayersWithPLT() {
  const promos = PROMO_PLAYERS.map(p => ({
    name: p.id, mmr: p.mmr, role: p.role || '—', flexRoles: p.flexRoles || null,
    acs: null, kd: null, isPLT: true, label: p.label
  }));
  return [...PLAYERS, ...promos];
}


// ═══════════════════════════════════════════════════════════════
//  EXPORT / IMPORT

function switchBulkTab(tab) {
  ['stats','legacy'].forEach(t => {
    document.getElementById('btab-' + t).classList.toggle('on', t === tab);
    document.getElementById('bpane-' + t).classList.toggle('on', t === tab);
  });
}

// ═══════════════════════════════════════════════════════════════
//  STATS PASTE PARSER  (unlabeled: name, rating, ACS, K, D, A, KD)
// ═══════════════════════════════════════════════════════════════
let pendingPlayers = [];

function isName(s) {
  // A name line: not purely numeric, contains letters, optionally has #
  return isNaN(parseFloat(s)) || s.includes('#') || /[a-zA-Z가-힣]/.test(s);
}

function parseStatsPaste(raw) {
  const msgEl     = document.getElementById('stats-parse-msg');
  const pendingEl = document.getElementById('stats-pending');

  if (!raw.trim()) {
    pendingEl.style.display = 'none';
    msgEl.style.display     = 'none';
    pendingPlayers = [];
    return;
  }

  // Split into lines, drop empty
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  // Group into player blocks: each block starts with a name line
  // followed by exactly 6 numeric values: rating, ACS, kills, deaths, assists, KD
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (isName(lines[i])) {
      const name = lines[i];
      const nums = [];
      let j = i + 1;
      while (j < lines.length && nums.length < 6) {
        const v = parseFloat(lines[j]);
        if (!isNaN(v)) { nums.push(v); j++; }
        else if (isName(lines[j])) break; // next player
        else j++;
      }
      if (nums.length >= 2) { // need at least rating + ACS
        blocks.push({ name, nums });
      }
      i = j;
    } else { i++; }
  }

  if (!blocks.length) {
    msgEl.textContent = 'Could not detect any players — make sure each player block starts with their name.';
    msgEl.style.display = 'block';
    pendingEl.style.display = 'none';
    pendingPlayers = [];
    return;
  }

  msgEl.style.display = 'none';

  // Map nums: [rating, ACS, kills, deaths, assists, KD]
  pendingPlayers = blocks.map((b, idx) => {
    const [rating, acs, kills, deaths, assists, kd] = b.nums;
    const computedKd = (kills && deaths && deaths > 0) ? parseFloat((kills/deaths).toFixed(2)) : null;
    return {
      id: 'pp_' + idx,
      name:    esc(b.name).slice(0, 64),
      acs:     acs    ?? null,
      kd:      kd     ?? computedKd,
      kills:   kills  ?? null,
      deaths:  deaths ?? null,
      assists: assists ?? null,
      hs:      null,
      kast:    null,
    };
  });

  renderPendingList();
  pendingEl.style.display = 'block';
  document.getElementById('pending-count-lbl').textContent = `— ${pendingPlayers.length} player${pendingPlayers.length !== 1 ? 's' : ''} detected`;
}

function renderPendingList() {
  const container = document.getElementById('pending-list');
  container.innerHTML = pendingPlayers.map((p, idx) => {
    const statStr = [
      p.acs    ? `ACS ${p.acs}`    : null,
      p.kd     ? `KD ${p.kd}`     : null,
      (p.kills && p.deaths) ? `${p.kills}/${p.deaths}/${p.assists ?? '?'}` : null,
    ].filter(Boolean).join('  ·  ');

    const roleMenuId  = `pmenu-${p.id}`;
    const roleLblId   = `plbl-${p.id}`;
    const roleValId   = `pval-${p.id}`;
    const mmrInputId  = `pmmr-${p.id}`;

    return `<div class="pending-player" id="prow-${p.id}">
      <div class="pending-info">
        <p class="pending-name">${esc(p.name)}</p>
        <p class="pending-stats">${statStr || 'No stats'}</p>
      </div>
      <div class="cfg-field" style="flex:0 0 auto;gap:4px;min-width:110px">
        <span class="cfg-label">Role</span>
        <div class="role-drop-wrap">
          <button type="button" class="role-drop-btn" onclick="toggleGenericDrop(event,'${roleMenuId}')">
            <span id="${roleLblId}" style="color:var(--muted)">None</span>
            <span class="caret">▾</span>
          </button>
          <div class="role-drop-menu" id="${roleMenuId}" style="">
            <div class="role-drop-item" onclick="pickGenericRole('${roleValId}','${roleLblId}','','${roleMenuId}');togglePendingFlex('${p.id}',false)">None</div>
            <div class="role-drop-item" onclick="pickGenericRole('${roleValId}','${roleLblId}','DUELIST','${roleMenuId}');togglePendingFlex('${p.id}',false)"><span class="role-dot" style="background:#F87171"></span>Duelist</div>
            <div class="role-drop-item" onclick="pickGenericRole('${roleValId}','${roleLblId}','CTRL','${roleMenuId}');togglePendingFlex('${p.id}',false)"><span class="role-dot" style="background:#60A5FA"></span>Controller</div>
            <div class="role-drop-item" onclick="pickGenericRole('${roleValId}','${roleLblId}','SENTI','${roleMenuId}');togglePendingFlex('${p.id}',false)"><span class="role-dot" style="background:#34D399"></span>Sentinel</div>
            <div class="role-drop-item" onclick="pickGenericRole('${roleValId}','${roleLblId}','INI','${roleMenuId}');togglePendingFlex('${p.id}',false)"><span class="role-dot" style="background:#FBBF24"></span>Initiator</div>
            <div class="role-drop-item" onclick="pickGenericRole('${roleValId}','${roleLblId}','FLEX','${roleMenuId}');togglePendingFlex('${p.id}',true)"><span class="role-dot" style="background:#A78BFA"></span>Flex</div>
          </div>
        </div>
        <input type="hidden" id="${roleValId}" value="">
        <div class="flex-checklist" id="pflex-${p.id}">
          <div class="flex-inner">
            <span class="flex-checklist-label">Can play:</span>
            <div class="flex-pill" data-val="DUELIST" data-on="0" onclick="toggleFlexPill(this)"><span class="role-dot" style="background:#F87171"></span>Duelist</div>
            <div class="flex-pill" data-val="CTRL" data-on="0" onclick="toggleFlexPill(this)"><span class="role-dot" style="background:#60A5FA"></span>Controller</div>
            <div class="flex-pill" data-val="SENTI" data-on="0" onclick="toggleFlexPill(this)"><span class="role-dot" style="background:#34D399"></span>Sentinel</div>
            <div class="flex-pill" data-val="INI" data-on="0" onclick="toggleFlexPill(this)"><span class="role-dot" style="background:#FBBF24"></span>Initiator</div>
          </div>
        </div>
      </div>
      <div class="cfg-field" style="flex:0 0 85px;gap:4px">
        <span class="cfg-label">MMR</span>
        <input class="cfg-input" id="${mmrInputId}" type="number" placeholder="175" min="1">
      </div>
      <span class="pe-del" onclick="removePending('${p.id}')" title="Remove" style="align-self:center;margin-top:14px">✕</span>
    </div>`;
  }).join('');
}

function togglePendingFlex(id, show) {
  const el = document.getElementById('pflex-' + id);
  if (el) el.classList.toggle('visible', show);
  if (!show) resetFlexPills('pflex-' + id);
}

function removePending(id) {
  pendingPlayers = pendingPlayers.filter(p => p.id !== id);
  document.getElementById('prow-' + id)?.remove();
  document.getElementById('pending-count-lbl').textContent =
    `— ${pendingPlayers.length} player${pendingPlayers.length !== 1 ? 's' : ''} detected`;
  if (!pendingPlayers.length) {
    document.getElementById('stats-pending').style.display = 'none';
  }
}

function clearPending() {
  pendingPlayers = [];
  document.getElementById('stats-paste-input').value = '';
  document.getElementById('stats-pending').style.display = 'none';
  document.getElementById('stats-parse-msg').style.display = 'none';
}

function confirmAllPending() {
  const errEl = document.getElementById('pending-error');
  errEl.style.display = 'none';

  const errors = [];
  const toAdd  = [];

  pendingPlayers.forEach(p => {
    const mmr  = parseInt(document.getElementById(`pmmr-${p.id}`)?.value);
    const role = document.getElementById(`pval-${p.id}`)?.value || '—';
    let flexRoles = null;
    if (role === 'FLEX') {
      flexRoles = getFlexRoles(`pflex-${p.id}`);
    }
    if (!mmr || mmr < 1)                       { errors.push(`${p.name}: MMR required`); return; }
    if (PLAYERS.find(x => x.name === p.name))  { errors.push(`${p.name}: already in list`); return; }
    toAdd.push({ name: p.name, mmr, role, acs: p.acs, kd: p.kd, flexRoles });
  });

  if (errors.length) {
    errEl.textContent = errors.join('  ·  ');
    errEl.style.display = 'block';
    return;
  }

  toAdd.forEach(p => PLAYERS.push(p));
  clearPending();
  renderPlayerList();
}

// Keep legacy single-player pending refs harmless
function togglePendingRoleDrop(e) {}
function pickPendingRole(v) {}
function confirmPending() { confirmAllPending(); }

function getSetupValues() {
  return {
    tierName:   document.getElementById('cfg-tier').value.trim(),
    cap:        parseInt(document.getElementById('cfg-cap').value)  || 0,
    rosterSize: parseInt(document.getElementById('cfg-size').value) || 5,
    bdeMmr:     parseInt(document.getElementById('promo-mmr-input')?.value) || 145,
  };
}

function addPlayer() {
  const name = esc(document.getElementById('add-name').value.trim()).slice(0, 64);
  const mmr  = parseInt(document.getElementById('add-mmr').value);
  const role = document.getElementById('add-role').value.trim().toUpperCase() || '—';
  const acs  = parseFloat(document.getElementById('add-acs').value)  || null;
  const kd   = parseFloat(document.getElementById('add-kd').value)   || null;

  let flexRoles = null;
  if (role === 'FLEX') {
    flexRoles = getFlexRoles('flex-checklist');
  }

  const errEl = document.getElementById('parse-error');
  if (!name)            { errEl.textContent = 'Name is required.';   errEl.style.display = 'block'; return; }
  if (!mmr || mmr < 1)  { errEl.textContent = 'Valid MMR required.'; errEl.style.display = 'block'; return; }
  if (PLAYERS.find(p => p.name === name)) {
    errEl.textContent = `"${name}" already in list.`; errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';

  PLAYERS.push({ name, mmr, role, acs, kd, flexRoles });
  ['add-name','add-mmr','add-acs','add-kd'].forEach(id => {
    document.getElementById(id).value = '';
  });
  pickRole('');
  renderPlayerList();
}

function parseBulk() {
  const raw   = document.getElementById('bulk-input').value.trim();
  const errEl = document.getElementById('bulk-error');
  if (!raw) { errEl.textContent = 'Nothing to import.'; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  let added = 0, skipped = [];

  lines.forEach(line => {
    const parts = line.split(/\s+/);
    if (parts.length < 2) { skipped.push(line); return; }
    const name = parts[0];
    const mmr  = parseInt(parts[1]);
    if (!name || isNaN(mmr) || mmr < 1) { skipped.push(line); return; }
    if (PLAYERS.find(p => p.name === name)) { skipped.push(`${name} (dup)`); return; }
    const role = parts[2] ? parts[2].toUpperCase() : '—';
    const acs  = parts[3] ? parseFloat(parts[3]) : null;
    const kd   = parts[4] ? parseFloat(parts[4]) : null;
    const hs   = parts[5] ? parseFloat(parts[5]) : null;
    const kast = parts[6] ? parseFloat(parts[6]) : null;
    PLAYERS.push({ name, mmr, role, acs, kd, hs, kast });
    added++;
  });

  if (skipped.length) {
    errEl.textContent = `Imported ${added}. Skipped: ${skipped.join(', ')}`;
    errEl.style.display = 'block';
  }
  if (added > 0) {
    document.getElementById('bulk-input').value = '';
    renderPlayerList();
  }
}

function removePlayer(name) {
  PLAYERS = PLAYERS.filter(p => p.name !== name);
  selected.delete(name);
  renderPlayerList();
}

async function clearPlayers() {
  if (SETTINGS.confirmClear) {
    const ok = await showConfirm('Clear all players?', 'This removes everyone from the list. This cannot be undone.', 'Clear All');
    if (!ok) return;
  }
  PLAYERS  = [];
  selected = new Set();
  renderPlayerList();
}

function renderPlayerList() {
  autoSave();
  const el  = document.getElementById('player-entry-list');
  const lbl = document.getElementById('player-count-lbl');
  lbl.textContent = PLAYERS.length ? `— ${PLAYERS.length} player${PLAYERS.length !== 1 ? 's' : ''}` : '';
  if (!PLAYERS.length) { el.innerHTML = '<div class="no-players-msg">No players added yet</div>'; return; }

  el.innerHTML = PLAYERS.map(p => `
    <div class="pentry">
      <span class="pe-name">${p.name}</span>
      <span class="pe-mmr">${p.mmr} MMR</span>
      <span class="pe-role">${p.role}${p.flexRoles ? ` (${p.flexRoles.map(r => ROLE_LABELS[r]||r).join('/')})` : ''}</span>
      <span class="pe-stats">
        ${[p.acs ? `ACS:${p.acs}` : '', p.kd ? `KD:${p.kd}` : ''].filter(Boolean).join('  ') || '—'}
      </span>
      <span class="pe-del" onclick="removePlayer('${p.name.replace(/'/g, "\\'")}')" title="Remove">✕</span>
    </div>
  `).join('');
}

function applyConfig() {
  const raw = getSetupValues();

  // Block if no cap set
  if (!raw.cap || raw.cap <= 0) {
    const el = document.getElementById('cfg-cap');
    el.classList.add('error');
    el.focus();
    el.placeholder = 'Required!';
    setTimeout(() => { el.classList.remove('error'); el.placeholder = '820'; }, 2200);
    return;
  }

  CFG = raw;
  selected = new Set();

  const tierDisplay = CFG.tierName || 'Roster';
  document.getElementById('page-title').textContent   = CFG.tierName ? `${CFG.tierName} — Roster Builder` : 'Roster Builder';
  document.getElementById('page-sub').textContent     = `Cap: ${CFG.cap} MMR · Max ${CFG.rosterSize} players`;
  document.getElementById('tier-badge').textContent   = CFG.tierName ? CFG.tierName.toUpperCase() : 'CONFIGURED';
  document.getElementById('cap-display').textContent  = CFG.cap;
  document.getElementById('cap-count').textContent    = `0/${CFG.rosterSize}`;
  document.getElementById('builder-section-lbl').textContent = tierDisplay + ' Roster';

  refreshBuilderPLTBar();
  buildGrid();
  renderAll();
  renderRanked();
  // Show nav items
  ['tab-builder','tab-all','tab-ranked','tab-roles','tab-duos'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = ''; el.classList.remove('locked'); }
  });
  document.getElementById('header-export-btn').style.display = 'block';
  sw('builder', document.getElementById('tab-builder'));
}


// ═══════════════════════════════════════════════════════════════
//  COMBO GENERATION
