const SCOUT_STATUS_ORDER  = { signed:0, rfa:1, de:2, dnd:3 };
const SCOUT_STATUS_COLORS = { signed:'#34D399', rfa:'#F59E0B', de:'#5B8BF7', dnd:'#565878' };
const SCOUT_STATUS_LABELS = { signed:'Signed', rfa:'RFA', de:'DE', dnd:'DND' };
const SCOUT_STATUS_CYCLE  = ['signed','rfa','de','dnd'];
const VDC_TIERS = ['Recruit','Prospect','Apprentice','Expert','Mythic'];
const VDC_TIER_COLORS = { Recruit:'#A78BFA', Prospect:'#5B8BF7', Apprentice:'#34D399', Expert:'#FBBF24', Mythic:'#F87171' };

function pickScoutStatus(val) {
  document.getElementById('scout-status-val').value = val;
  const lbl = document.getElementById('scout-status-label');
  lbl.textContent = SCOUT_STATUS_LABELS[val] || val;
  lbl.style.color = SCOUT_STATUS_COLORS[val] || 'var(--muted)';
  const wrap = document.getElementById('scout-status-menu').closest('.role-drop-wrap');
  if (wrap) wrap.classList.remove('open');
}

function pickScoutTier(val) {
  document.getElementById('scout-tier-val').value = val;
  const lbl = document.getElementById('scout-tier-label');
  lbl.textContent = val || '— tier —';
  lbl.style.color = val ? (VDC_TIER_COLORS[val] || 'var(--text)') : 'var(--muted)';
  const wrap = document.getElementById('scout-tier-menu').closest('.role-drop-wrap');
  if (wrap) wrap.classList.remove('open');
}

function setScoutTierFilter(tier) {
  scoutTierFilter = tier;
  document.querySelectorAll('.scout-tier-tab').forEach(t => {
    t.classList.toggle('on', t.dataset.tier === tier);
  });
  renderScoutList();
}

function setScoutRoleFilter(role) {
  scoutRoleFilter = role;
  document.querySelectorAll('[data-role-filter]').forEach(p => {
    p.classList.toggle('on', p.dataset.roleFilter === role);
  });
  renderScoutList();
}

function setScoutStatusFilter(status) {
  scoutStatusFilter = status;
  document.querySelectorAll('[data-status-filter]').forEach(p => {
    p.classList.toggle('on', p.dataset.statusFilter === status);
  });
  renderScoutList();
}

function getScoutRolePills() {
  return [...document.querySelectorAll('.scout-role-pill.on')].map(p => p.dataset.role);
}

function toggleScoutRolePill(el) {
  const role = el.dataset.role;
  const color = ROLE_COLORS[role] || '#565878';
  el.classList.toggle('on');
  if (el.classList.contains('on')) {
    el.style.borderColor = color;
    el.style.color = color;
    el.style.background = `${color}1a`;
  } else {
    el.style.borderColor = '';
    el.style.color = '';
    el.style.background = '';
  }
}

function resetScoutRolePills() {
  document.querySelectorAll('.scout-role-pill').forEach(p => {
    p.classList.remove('on');
    p.style.borderColor = '';
    p.style.color = '';
    p.style.background = '';
  });
}

function toggleScoutBulk() {
  const area = document.getElementById('scout-bulk-area');
  const show = area.style.display === 'none';
  area.style.display = show ? 'block' : 'none';
  if (show) document.getElementById('scout-bulk-input').focus();
}

function bulkAddScouts() {
  const raw    = document.getElementById('scout-bulk-input').value;
  const status = document.getElementById('scout-status-val').value || 'rfa';
  const tier   = document.getElementById('scout-tier-val').value;
  const roles  = getScoutRolePills();
  const lines  = raw.split('\n').map(s => s.trim()).filter(Boolean);
  const existing = new Set(SCOUTS.map(s => s.name.toLowerCase()));
  let added = 0;
  lines.forEach(line => {
    const name = esc(line).slice(0,64);
    if (!name || existing.has(name.toLowerCase())) return;
    SCOUTS.push({ id: _scoutIdSeq++, name, mmr: 0, roles: [...roles], tier, status, notes: '', tracker: '', acs: 0, kd: 0 });
    existing.add(name.toLowerCase());
    added++;
  });
  document.getElementById('scout-bulk-input').value = '';
  toggleScoutBulk();
  if (added) { autoSave(); renderScoutList(); showToast(`✓ Added ${added} player${added!==1?'s':''}`); }
  else showToast('No new players added (duplicates skipped)');
}

function addScout() {
  const name    = document.getElementById('scout-name').value.trim();
  const mmr     = parseInt(document.getElementById('scout-mmr').value)    || 0;
  const roles   = getScoutRolePills();
  const tier    = document.getElementById('scout-tier-val').value;
  const status  = document.getElementById('scout-status-val').value || 'rfa';
  const notes   = document.getElementById('scout-notes').value.trim();
  const tracker = document.getElementById('scout-tracker').value.trim();
  const acs = 0, kd = 0;
  const errEl   = document.getElementById('scout-add-error');

  if (!name) {
    errEl.textContent = 'Name is required.';
    errEl.style.display = 'block';
    document.getElementById('scout-name').focus();
    setTimeout(() => { errEl.style.display = 'none'; }, 2200);
    return;
  }
  errEl.style.display = 'none';

  SCOUTS.push({ id: _scoutIdSeq++, name: esc(name).slice(0,64), mmr, roles, tier, status, notes: esc(notes).slice(0,400), tracker: esc(tracker).slice(0,300), acs, kd });

  ['scout-name','scout-mmr','scout-notes','scout-tracker'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  pickScoutStatus('rfa');
  pickScoutTier('');
  resetScoutRolePills();

  autoSave();
  renderScoutList();
}

function removeScout(id) {
  SCOUTS = SCOUTS.filter(s => s.id !== id);
  autoSave();
  renderScoutList();
}

function cycleScoutStatus(id) {
  const scout = SCOUTS.find(s => s.id === id);
  if (!scout) return;
  const idx = SCOUT_STATUS_CYCLE.indexOf(scout.status);
  scout.status = SCOUT_STATUS_CYCLE[(idx + 1) % SCOUT_STATUS_CYCLE.length];
  autoSave();
  renderScoutList();
}

function scoutSort(key) {
  if (scoutSortKey === key) { scoutSortDir *= -1; }
  else { scoutSortKey = key; scoutSortDir = 1; }
  renderScoutList();
}

let _notePopoverScoutId = null;

function openNotePopover(e, id) {
  e.stopPropagation();
  const scout = SCOUTS.find(s => s.id === id);
  if (!scout) return;
  _notePopoverScoutId = id;

  const pop = document.getElementById('scout-note-popover');
  const ta  = document.getElementById('scout-note-ta');
  ta.value  = scout.notes || '';

  // Position near the clicked cell
  const r = e.currentTarget.getBoundingClientRect();
  const popW = 280, popH = 140;
  let left = r.left;
  let top  = r.bottom + 6;
  if (left + popW > window.innerWidth - 8)  left = window.innerWidth - popW - 8;
  if (top + popH  > window.innerHeight - 8) top  = r.top - popH - 6;

  pop.style.left    = left + 'px';
  pop.style.top     = top  + 'px';
  pop.style.display = 'block';
  ta.focus();
  ta.selectionStart = ta.selectionEnd = ta.value.length;
}

function closeNotePopover() {
  const pop = document.getElementById('scout-note-popover');
  const ta  = document.getElementById('scout-note-ta');
  if (!pop || pop.style.display === 'none') return;
  if (_notePopoverScoutId !== null) {
    const scout = SCOUTS.find(s => s.id === _notePopoverScoutId);
    if (scout) {
      scout.notes = esc(ta.value).slice(0,400);
      autoSave();
      renderScoutList();
    }
  }
  pop.style.display = 'none';
  _notePopoverScoutId = null;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNotePopover(); closeInlinePops(); } });
document.addEventListener('click', e => {
  const notePop = document.getElementById('scout-note-popover');
  if (notePop && notePop.style.display !== 'none' && !notePop.contains(e.target)) closeNotePopover();
  ['scout-roles-pop','scout-tier-pop'].forEach(id => {
    const p = document.getElementById(id);
    if (p && p.style.display !== 'none' && !p.contains(e.target)) closeInlinePops();
  });
});

// ─── INLINE ROLE / TIER EDIT ──────────────────────────────────────
let _inlinePopScoutId = null;

function _positionPop(pop, e) {
  pop.style.display = 'block';
  const r = e.currentTarget.getBoundingClientRect();
  let left = r.left, top = r.bottom + 6;
  const pw = pop.offsetWidth || 220, ph = pop.offsetHeight || 160;
  if (left + pw > window.innerWidth  - 8) left = window.innerWidth  - pw - 8;
  if (top  + ph > window.innerHeight - 8) top  = r.top - ph - 6;
  pop.style.left = left + 'px';
  pop.style.top  = top  + 'px';
}

function closeInlinePops() {
  document.getElementById('scout-roles-pop').style.display = 'none';
  document.getElementById('scout-tier-pop').style.display  = 'none';
  if (_inlinePopScoutId !== null) renderScoutList();
  _inlinePopScoutId = null;
}

function openRolesPop(e, id) {
  e.stopPropagation();
  closeInlinePops(); closeNotePopover();
  _inlinePopScoutId = id;
  const scout = SCOUTS.find(s => s.id === id);
  if (!scout) return;
  const currentRoles = Array.isArray(scout.roles) ? scout.roles : (scout.role ? [scout.role] : []);
  const pop = document.getElementById('scout-roles-pop');
  // Reset pills
  pop.querySelectorAll('.scout-role-pill').forEach(pill => {
    const role  = pill.dataset.role;
    const color = ROLE_COLORS[role] || '#565878';
    const on    = currentRoles.includes(role);
    pill.classList.toggle('on', on);
    pill.style.borderColor = on ? color : '';
    pill.style.color       = on ? color : '';
    pill.style.background  = on ? color + '1a' : '';
    pill.onclick = () => {
      pill.classList.toggle('on');
      const isOn = pill.classList.contains('on');
      pill.style.borderColor = isOn ? color : '';
      pill.style.color       = isOn ? color : '';
      pill.style.background  = isOn ? color + '1a' : '';
      // Save immediately
      const s2 = SCOUTS.find(s => s.id === _inlinePopScoutId);
      if (s2) {
        s2.roles = [...pop.querySelectorAll('.scout-role-pill.on')].map(p => p.dataset.role);
        autoSave();
      }
    };
  });
  _positionPop(pop, e);
}

function openTierPop(e, id) {
  e.stopPropagation();
  closeInlinePops(); closeNotePopover();
  _inlinePopScoutId = id;
  const pop = document.getElementById('scout-tier-pop');
  _positionPop(pop, e);
}

function setScoutTierInline(tier) {
  const scout = SCOUTS.find(s => s.id === _inlinePopScoutId);
  if (scout) { scout.tier = tier; autoSave(); renderScoutList(); }
  closeInlinePops();
}

function renderScoutList() {
  const tbody = document.getElementById('scout-tbody');
  const empty = document.getElementById('scout-empty');
  if (!tbody) return;

  // Update sort arrows
  document.querySelectorAll('[id^="sarrow-"]').forEach(el => el.textContent = '');
  const arrowEl = document.getElementById('sarrow-' + scoutSortKey);
  if (arrowEl) arrowEl.textContent = scoutSortDir === 1 ? '▲' : '▼';
  document.querySelectorAll('.scout-table thead th').forEach(th => th.classList.remove('sort-active'));
  if (arrowEl) arrowEl.closest('th').classList.add('sort-active');

  let filtered = SCOUTS;
  if (scoutTierFilter)   filtered = filtered.filter(s => s.tier === scoutTierFilter);
  if (scoutRoleFilter)   filtered = filtered.filter(s => Array.isArray(s.roles) ? s.roles.includes(scoutRoleFilter) : s.role === scoutRoleFilter);
  if (scoutStatusFilter) filtered = filtered.filter(s => s.status === scoutStatusFilter);

  const sorted = [...filtered].sort((a, b) => {
    let av = a[scoutSortKey], bv = b[scoutSortKey];
    if (scoutSortKey === 'status') { av = SCOUT_STATUS_ORDER[av] ?? 99; bv = SCOUT_STATUS_ORDER[bv] ?? 99; }
    if (scoutSortKey === 'tier') {
      const ti = t => VDC_TIERS.indexOf(t);
      return (ti(av) - ti(bv)) * scoutSortDir;
    }
    if (typeof av === 'string') return av.localeCompare(bv) * scoutSortDir;
    return ((av||0) - (bv||0)) * scoutSortDir;
  });

  if (sorted.length === 0) {
    tbody.innerHTML = '';
    if (empty) {
      const parts = [];
      if (scoutTierFilter)   parts.push(scoutTierFilter);
      if (scoutRoleFilter)   parts.push(ROLE_LABELS[scoutRoleFilter]);
      if (scoutStatusFilter) parts.push(SCOUT_STATUS_LABELS[scoutStatusFilter]);
      empty.textContent = parts.length
        ? `No ${parts.join(' / ')} players scouted yet.`
        : 'No players scouted yet. Add someone above to get started.';
      empty.style.display = 'block';
    }
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = sorted.map((s, i) => {
    const roles   = Array.isArray(s.roles) ? s.roles : (s.role ? [s.role] : []);
    const roleDots = roles.map(r => `<span class="scout-role-dot" style="background:${ROLE_COLORS[r]||'#565878'}" title="${ROLE_LABELS[r]||r}"></span>`).join('') || '<span style="color:var(--muted)">—</span>';
    const statusCls  = s.status || 'rfa';
    const statusLbl  = SCOUT_STATUS_LABELS[s.status] || s.status;
    const tierColor  = VDC_TIER_COLORS[s.tier] || 'var(--muted)';
    const tierLbl    = s.tier || '—';
    const mmrStr     = s.mmr ? s.mmr : '—';
    const delay      = Math.min(i * 30, 200);
    const isDND      = s.status === 'dnd';
    const safeName   = s.name.replace(/'/g,"\\'");
    const vdcUrl     = 'https://vdc.gg/player/' + s.name.replace(/#/g,'%23') + '?season=10&type=season&by=summary';
    const trackerBtn = s.tracker ? `<a href="${s.tracker}" target="_blank" rel="noopener" class="scout-action-btn" title="Open tracker" style="text-decoration:none">🔗</a>` : '';
    const vdcBtn     = `<button class="scout-action-btn" onclick="window.open('${vdcUrl}','_blank')" title="VDC profile">VDC</button>`;
    const noteVal    = (s.notes||'').replace(/"/g,'&quot;');
    return `<tr style="animation-delay:${delay}ms" class="${isDND?'scout-dnd':''}">
      <td><strong style="color:var(--text);font-weight:500">${s.name}</strong></td>
      <td>${mmrStr}</td>
      <td><div class="scout-editable" style="display:flex;gap:3px;align-items:center;min-width:28px" onclick="openRolesPop(event,${s.id})" title="Edit roles">${roleDots}</div></td>
      <td><span class="scout-editable" style="color:${tierColor};font-weight:500" onclick="openTierPop(event,${s.id})" title="Edit tier">${tierLbl}</span></td>
      <td><span class="scout-status ${statusCls}" onclick="cycleScoutStatus(${s.id})" title="Click to cycle status" style="cursor:pointer">${statusLbl}</span></td>
      <td><span class="scout-note-cell${s.notes ? ' has-note' : ''}" onclick="openNotePopover(event,${s.id})" title="${noteVal||'Click to add notes'}">${s.notes || '+ notes'}</span></td>
      <td>
        <div style="display:flex;gap:4px;align-items:center">
          ${trackerBtn}
          ${vdcBtn}
          <button class="scout-action-btn sim" onclick="simIfSigned(${s.id})" title="Sim if signed">Sim</button>
          <button class="scout-action-btn danger" onclick="removeScout(${s.id})" title="Remove">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function simIfSigned(id) {
  const scout = SCOUTS.find(s => s.id === id);
  if (!scout) return;

  // Check if roster is built
  if (!CFG.cap || PLAYERS.length === 0) {
    showSimResult(id, 'bad', 'Build a roster first (Setup → Apply & Build) before simulating.');
    return;
  }

  // Temporarily inject scout as a player
  const mockPlayer = {
    name: scout.name,
    mmr:  scout.mmr || Math.round(CFG.cap / CFG.rosterSize),
    role: (Array.isArray(scout.roles) && scout.roles[0]) || scout.role || 'FLEX',
    flexRoles: null,
    acs: scout.acs || null,
    kd:  scout.kd  || null,
  };

  // Swap global PLAYERS temporarily
  const origPlayers = PLAYERS;
  PLAYERS = [...PLAYERS.filter(p => p.name !== scout.name), mockPlayer];

  const allCombos = genCombos();
  PLAYERS = origPlayers;

  const validCombos = allCombos.filter(c => {
    if (!c.valid) return false;
    for (const name of LOCKED_PLAYERS) {
      if (!c.team.some(p => p.name === name)) return false;
    }
    return c.team.some(p => p.name === scout.name);
  });

  if (validCombos.length === 0) {
    showSimResult(id, 'bad', `No valid combos with ${scout.name} under the cap. Check MMR vs cap (${CFG.cap}).`);
  } else {
    const best = validCombos.sort((a,b) => b.score - a.score)[0];
    const names = best.team.map(p => p.name).join(', ');
    showSimResult(id, 'good', `${validCombos.length} valid combo${validCombos.length>1?'s':''} found. Best: [${names}] — rem ${best.rem} MMR`);
  }
}

function showSimResult(id, type, msg) {
  // Remove any existing result rows
  document.querySelectorAll('.scout-sim-row').forEach(r => r.remove());

  const tbody = document.getElementById('scout-tbody');
  if (!tbody) return;

  // Find the row for this scout
  const rows = tbody.querySelectorAll('tr');
  const scout = SCOUTS.find(s => s.id === id);
  if (!scout) return;

  // Find row index in sorted order
  let targetRow = null;
  rows.forEach(row => {
    const btn = row.querySelector('.scout-action-btn.sim');
    if (btn && btn.getAttribute('onclick') === `simIfSigned(${id})`) targetRow = row;
  });
  if (!targetRow) return;

  const resultRow = document.createElement('tr');
  resultRow.className = 'scout-sim-row';
  resultRow.innerHTML = `<td colspan="9" class="scout-sim-result ${type}">${msg} <button onclick="this.closest('tr').remove()" style="margin-left:8px;background:none;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:11px">✕</button></td>`;
  targetRow.after(resultRow);
}

function shareScouts() {
  if (SCOUTS.length === 0) {
    showToast('No players scouted yet.');
    return;
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(SCOUTS))));
  const url = location.href.split('#')[0] + '#scout=' + encoded;
  navigator.clipboard.writeText(url).then(() => {
    showToast('✓ Link copied to clipboard');
  }).catch(() => {
    // Fallback: prompt
    prompt('Copy this link:', url);
  });
}

function showToast(msg) {
  const el = document.getElementById('scout-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function checkScoutShare() {
  const hash = location.hash;
  if (!hash.startsWith('#scout=')) return;
  try {
    const raw = decodeURIComponent(escape(atob(hash.slice(7))));
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return;
    _pendingScoutImport = data;
    const banner = document.getElementById('scout-import-banner');
    if (banner) banner.style.display = 'flex';
    // Auto-switch to scouting tab
    const tab = document.getElementById('tab-scouting');
    if (tab) sw('scouting', tab);
  } catch(e) {}
  // Clean hash from URL
  history.replaceState(null, '', location.pathname + location.search);
}

function importSharedScouts() {
  if (!_pendingScoutImport) return;
  let added = 0;
  const existingNames = new Set(SCOUTS.map(s => s.name.toLowerCase()));
  _pendingScoutImport.forEach(s => {
    const name = esc(String(s.name || '')).slice(0,64);
    if (!name || existingNames.has(name.toLowerCase())) return;
    SCOUTS.push({
      id:      _scoutIdSeq++,
      name,
      mmr:     parseInt(s.mmr)  || 0,
      role:    ['DUELIST','CTRL','SENTI','INI','FLEX',''].includes(s.role) ? s.role : '',
      tier:    VDC_TIERS.includes(s.tier) ? s.tier : '',
      status:  ['signed','rfa','de','dnd'].includes(s.status) ? s.status : (s.status === 'sign' ? 'signed' : 'rfa'),
      roles:   Array.isArray(s.roles) ? s.roles.filter(r => ROLE_COLORS[r]) : (s.role && ROLE_COLORS[s.role] ? [s.role] : []),
      tracker: esc(String(s.tracker || '')).slice(0,300),
      notes:   esc(String(s.notes || '')).slice(0,400),
      acs:     parseFloat(s.acs) || 0,
      kd:      parseFloat(s.kd)  || 0,
    });
    existingNames.add(name.toLowerCase());
    added++;
  });
  _pendingScoutImport = null;
  dismissScoutBanner();
  autoSave();
  renderScoutList();
  showToast(`✓ Imported ${added} scout${added !== 1 ? 's' : ''}`);
}

function dismissScoutBanner() {
  const banner = document.getElementById('scout-import-banner');
  if (banner) banner.style.display = 'none';
  _pendingScoutImport = null;
  history.replaceState(null, '', location.pathname + location.search);
}
