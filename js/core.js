// ─── AUTO-SAVE / AUTO-LOAD ──────────────────────────────────────
function buildSaveData() {
  return {
    version: 1,
    cfg: {
      tierName:   document.getElementById('cfg-tier').value.trim(),
      cap:        parseInt(document.getElementById('cfg-cap').value) || 0,
      rosterSize: parseInt(document.getElementById('cfg-size').value) || 5,
    },
    players:       PLAYERS,
    promoPlayers:  PROMO_PLAYERS,
    duos:          DUOS,
    badDuos:       BAD_DUOS,
    lockedPlayers: [...LOCKED_PLAYERS],
    scouts:        SCOUTS,
  };
}

function autoSave() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(buildSaveData())); } catch(e) {}
}

function autoLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data.version) return;

    PLAYERS        = (data.players      || []).map(sanitizePlayer);
    PROMO_PLAYERS  = (data.promoPlayers || []).map(sanitizePromo);
    DUOS           = (data.duos     || []).filter(d => d.a && d.b).map(d => ({ a: esc(d.a).slice(0,64), b: esc(d.b).slice(0,64) }));
    BAD_DUOS       = (data.badDuos  || []).filter(d => d.a && d.b).map(d => ({ a: esc(d.a).slice(0,64), b: esc(d.b).slice(0,64) }));
    LOCKED_PLAYERS = new Set((data.lockedPlayers || []).map(n => esc(String(n)).slice(0,64)));
    _promoIdSeq    = PROMO_PLAYERS.length + 1;

    if (data.cfg) {
      document.getElementById('cfg-tier').value = data.cfg.tierName || '';
      document.getElementById('cfg-cap').value  = data.cfg.cap      || '';
      document.getElementById('cfg-size').value = data.cfg.rosterSize || 5;
    }

    SCOUTS = (data.scouts || []).map(s => ({
      id:      s.id     || (_scoutIdSeq++),
      name:    esc(String(s.name  || '')).slice(0,64),
      mmr:     parseInt(s.mmr)  || 0,
      role:    ['DUELIST','CTRL','SENTI','INI','FLEX',''].includes(s.role) ? s.role : '',
      tier:    VDC_TIERS.includes(s.tier) ? s.tier : '',
      status:  ['signed','fa','rfa','de','dnd'].includes(s.status) ? s.status : (s.status === 'sign' ? 'signed' : 'rfa'),
      roles:   Array.isArray(s.roles) ? s.roles.filter(r => ROLE_COLORS[r]) : (s.role && ROLE_COLORS[s.role] ? [s.role] : []),
      tracker: esc(String(s.tracker || '')).slice(0,300),
      notes:   esc(String(s.notes || '')).slice(0,400),
      acs:     parseFloat(s.acs) || 0,
      kd:      parseFloat(s.kd)  || 0,
    }));

    renderPlayerList();
    renderPromoList();
    renderScoutList();

    if (PLAYERS.length && data.cfg?.cap) applyConfig();
  } catch(e) {}
}

function clearAutoSave() {
  if (!confirm('Clear all saved data? This cannot be undone.')) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
}

function exportConfig() {
  const data = buildSaveData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${data.cfg.tierName || 'roster'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importConfig() {
  document.getElementById('import-file-input').click();
}

function handleImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version || !data.players) throw new Error('Invalid file');

      // Restore state — sanitize everything coming from the file
      PLAYERS        = (data.players      || []).map(sanitizePlayer);
      PROMO_PLAYERS  = (data.promoPlayers || []).map(sanitizePromo);
      DUOS           = (data.duos     || []).filter(d => d.a && d.b).map(d => ({ a: esc(d.a).slice(0,64), b: esc(d.b).slice(0,64) }));
      BAD_DUOS       = (data.badDuos  || []).filter(d => d.a && d.b).map(d => ({ a: esc(d.a).slice(0,64), b: esc(d.b).slice(0,64) }));
      LOCKED_PLAYERS = new Set((data.lockedPlayers || []).map(n => esc(String(n)).slice(0,64)));
      _promoIdSeq    = PROMO_PLAYERS.length + 1;

      // Restore config fields
      if (data.cfg) {
        document.getElementById('cfg-tier').value = data.cfg.tierName || '';
        document.getElementById('cfg-cap').value  = data.cfg.cap      || '';
        document.getElementById('cfg-size').value = data.cfg.rosterSize || 5;
      }

      renderPlayerList();
      renderPromoList();
      input.value = '';

      if (SETTINGS.autoApply) {
        applyConfig();
      } else {
        const errEl = document.getElementById('parse-error');
        errEl.textContent = `Loaded ${PLAYERS.length} player${PLAYERS.length !== 1 ? 's' : ''} from file.`;
        errEl.style.color = 'var(--green)';
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; errEl.style.color = ''; }, 3000);
      }

    } catch (err) {
      const errEl = document.getElementById('parse-error');
      errEl.textContent = 'Could not read file - make sure it\'s a valid roster builder export.';
      errEl.style.display = 'block';
    }
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════════
//  SANITIZE  — prevent XSS from user-entered strings in innerHTML
// ═══════════════════════════════════════════════════════════════
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Sanitize a player object coming in from import
function sanitizePlayer(p) {
  return {
    name:      esc(p.name      || '').slice(0, 64),
    mmr:       Math.max(1, Math.min(9999, parseInt(p.mmr) || 0)),
    role:      esc(p.role      || '—').slice(0, 20),
    acs:       p.acs  != null ? parseFloat(p.acs)  : null,
    kd:        p.kd   != null ? parseFloat(p.kd)   : null,
    flexRoles: Array.isArray(p.flexRoles) ? p.flexRoles.map(r => esc(r).slice(0,10)) : null,
  };
}

function sanitizePromo(p) {
  return {
    id:        esc(p.id    || '').slice(0, 32),
    label:     esc(p.label || '').slice(0, 64),
    mmr:       Math.max(1, Math.min(9999, parseInt(p.mmr) || 145)),
    role:      esc(p.role  || '—').slice(0, 20),
    flexRoles: Array.isArray(p.flexRoles) ? p.flexRoles.map(r => esc(r).slice(0,10)) : null,
  };
}

// ═══════════════════════════════════════════════════════════════
//  BULK HELP TOGGLE

function toggleBulkHelp() {
  const pop = document.getElementById('bulk-help-popover');
  const btn = document.getElementById('bulk-help-trigger');
  const showing = pop.style.display !== 'none';
  pop.style.display = showing ? 'none' : 'block';
  btn.classList.toggle('active', !showing);
}

// ═══════════════════════════════════════════════════════════════
//  ROLE DROPDOWN  (generic)

// ─── DROPDOWN PORTAL ─────────────────────────────────────────────
let _openDropWrap = null;

function _getPortal() {
  let p = document.getElementById('__drop-portal__');
  if (!p) {
    p = document.createElement('div');
    p.id = '__drop-portal__';
    p.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;pointer-events:none';
    document.body.appendChild(p);
  }
  return p;
}

function _closePortal() {
  if (!_openDropWrap) return;
  _openDropWrap.classList.remove('open');
  const portal = document.getElementById('__drop-portal__');
  if (portal) portal.innerHTML = '';
  _openDropWrap = null;
}

document.addEventListener('click', _closePortal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') _closePortal(); });

function toggleGenericDrop(e, menuId) {
  e.stopPropagation();
  const menu = document.getElementById(menuId);
  const wrap = menu.closest('.role-drop-wrap');

  // Clicking the already-open wrap closes it
  if (_openDropWrap === wrap) { _closePortal(); return; }

  // Close any other open drop
  _closePortal();

  // Position portal menu using fixed coords of the button
  const btn = wrap.querySelector('.role-drop-btn');
  const r   = btn.getBoundingClientRect();
  const itemCount = menu.querySelectorAll('.role-drop-item').length;
  const estH = itemCount * 40 + 12;
  const spaceBelow = window.innerHeight - r.bottom;
  const flipUp = spaceBelow < estH + 8 && r.top > estH;

  // Clone the menu into the portal
  const portal = _getPortal();
  const clone  = menu.cloneNode(true);
  clone.id = menuId + '__portal';
  clone.style.cssText = `
    position: fixed;
    width: ${r.width}px;
    left: ${r.left}px;
    ${flipUp
      ? `bottom: ${window.innerHeight - r.top + 4}px; top: auto; transform-origin: bottom center;`
      : `top: ${r.bottom + 4}px; bottom: auto; transform-origin: top center;`
    }
    pointer-events: auto;
    background: var(--dark2);
    border: 1px solid var(--border2);
    border-radius: 6px;
    z-index: 9000;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35);
    opacity: 1; visibility: visible; transform: translateY(0) scale(1);
  `;

  // Re-wire click handlers on cloned items — read from original items
  clone.querySelectorAll('.role-drop-item').forEach((cloneItem, i) => {
    const origItem = menu.querySelectorAll('.role-drop-item')[i];
    cloneItem.addEventListener('click', e2 => {
      e2.stopPropagation();
      origItem.click(); // fire original handler
      _closePortal();
    });
  });

  portal.appendChild(clone);
  wrap.classList.add('open');
  _openDropWrap = wrap;
}

function pickGenericRole(valId, lblId, val, menuId) {
  document.getElementById(valId).value = val;
  const lbl = document.getElementById(lblId);
  lbl.textContent = val ? (ROLE_LABELS[val] || val) : 'None';
  lbl.style.color = val ? (ROLE_COLORS[val] || 'var(--text)') : 'var(--muted)';
  const wrap = document.getElementById(menuId).closest('.role-drop-wrap');
  wrap.classList.remove('open');
  setListOverflow(wrap, false);
}

// Wrappers for the main add-player dropdown
function toggleRoleDrop(e)  { toggleGenericDrop(e, 'role-drop-menu'); }
function pickRole(val) {
  pickGenericRole('add-role', 'role-drop-label', val, 'role-drop-menu');
  // Show/hide flex checklist
  const cl = document.getElementById('flex-checklist');
  if (val === 'FLEX') {
    cl.classList.add('visible');
  } else {
    cl.classList.remove('visible');
    resetFlexPills('flex-checklist');
  }
}

function toggleFlexPill(label) {
  const isOn = label.dataset.on === '1';
  label.dataset.on = isOn ? '0' : '1';
  label.classList.toggle('on', !isOn);
}

function getFlexRoles(containerId) {
  const pills = document.querySelectorAll(`#${containerId} .flex-pill[data-on="1"]`);
  const vals = [...pills].map(p => p.dataset.val);
  return vals.length ? vals : null;
}

function resetFlexPills(containerId) {
  document.querySelectorAll(`#${containerId} .flex-pill`).forEach(p => {
    p.dataset.on = '0';
    p.classList.remove('on');
  });
}

// Close all on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.role-drop-wrap.open').forEach(w => {
    w.classList.remove('open');
    setListOverflow(w, false);
  });
});


function sw(id, btn) {
  document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('p-' + id).classList.add('on');
  if (id === 'all')      renderAll();
  if (id === 'ranked')   renderRanked();
  if (id === 'roles')    { updateRolePickerUI(); renderRoles(); }
  if (id === 'duos')     renderDuos();
}


// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
refreshBuilderPLTBar();
buildGrid();
renderAll();
renderRanked();

// Init settings toggles to match default state
toggleSetting('confirmClear'); // starts true, toggle once to show ON state
SETTINGS.confirmClear = true;  // toggle flipped it to false, restore

// ═══════════════════════════════════════════════════════════════
//  DISCORD COPY
// ═══════════════════════════════════════════════════════════════
function copyForDiscord() {
  const pool = allPlayersWithPLT();
  const team = [...selected].map(n => pool.find(p => p.name === n)).filter(Boolean);
  if (!team.length) return;

  const total = team.reduce((s, p) => s + p.mmr, 0);
  const bar   = '━━━━━━━━━━━━━━━━━━━━';
  const ROLE_SHORT = { DUELIST:'DUE', CTRL:'CTRL', SENTI:'SENTI', INI:'INI', FLEX:'FLEX', '—':'—' };

  const lines = team.map(p => {
    const name = p.isPLT ? (p.label || 'Promo Player') : p.name;
    const role = ROLE_SHORT[p.role] || p.role || '—';
    return `${name} · ${role} · ${p.mmr} MMR`;
  });

  const text = [
    `📋 ${CFG.tierName ? CFG.tierName + ' Roster' : 'Roster'}`,
    bar,
    ...lines,
    bar,
    `Total: ${total} / ${CFG.cap} MMR · ${CFG.cap - total} remaining`,
  ].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('discord-copy-btn');
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy for Discord';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ═══════════════════════════════════════════════════════════════
//  CUSTOM CONFIRM MODAL

let _confirmResolve = null;

function showConfirm(msg, sub, okLabel) {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    document.getElementById('confirm-modal-msg').textContent = msg;
    document.getElementById('confirm-modal-sub').textContent = sub || '';
    if (okLabel) document.getElementById('confirm-modal-ok').textContent = okLabel;
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'flex';
  });
}

function resolveConfirm(result) {
  document.getElementById('confirm-modal').style.display = 'none';
  if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
}

// Close on backdrop click
document.getElementById('confirm-modal').addEventListener('click', function(e) {
  if (e.target === this) resolveConfirm(false);
});

// ═══════════════════════════════════════════════════════════════
//  SETTINGS TOGGLES
// ═══════════════════════════════════════════════════════════════
function toggleSetting(key) {
  SETTINGS[key] = !SETTINGS[key];
  const toggle = document.getElementById(`setting-${key}-toggle`);
  const lbl    = document.getElementById(`setting-${key}-lbl`);
  if (!toggle || !lbl) return;
  const on = SETTINGS[key];
  toggle.querySelector('.toggle-thumb').style.transform = on ? 'translateX(13px)' : '';
  toggle.querySelector('.toggle-track').style.background = on ? 'rgba(91,139,247,0.15)' : '';
  toggle.querySelector('.toggle-track').style.borderColor = on ? 'rgba(91,139,247,0.3)' : '';
  toggle.querySelector('.toggle-thumb').style.background = on ? 'var(--red)' : '';
  lbl.textContent = on ? 'On' : 'Off';
}

// ═══════════════════════════════════════════════════════════════
//  THEME TOGGLE
// ═══════════════════════════════════════════════════════════════
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  const label = isLight ? 'Dark' : 'Light';
  ['theme-lbl','theme-lbl2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });
}

// ═══════════════════════════════════════════════════════════════
//  SCOUTING

function showToast(msg) {
  const el = document.getElementById('scout-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function setFontSize(scale) {
  const pct = Math.round(scale * 100);
  document.documentElement.style.setProperty('--content-zoom', scale);
  localStorage.setItem('vdc-font-size', scale);
  _syncSizeSlider(pct);
}

function setFontSizeFromSlider(pct) {
  const scale = pct / 100;
  document.documentElement.style.setProperty('--content-zoom', scale);
  localStorage.setItem('vdc-font-size', scale);
  _syncSizeSlider(pct);
}

function _previewSizeSlider(pct) {
  const fill = document.getElementById('size-range-fill');
  const lbl  = document.getElementById('size-val');
  const slider = document.getElementById('font-size-range');
  if (lbl) lbl.textContent = pct + '%';
  if (fill && slider) {
    const min = parseFloat(slider.min), max = parseFloat(slider.max);
    fill.style.width = ((pct - min) / (max - min) * 100) + '%';
  }
}

function _syncSizeSlider(pct) {
  const slider = document.getElementById('font-size-range');
  const fill   = document.getElementById('size-range-fill');
  const lbl    = document.getElementById('size-val');
  if (slider) slider.value = pct;
  if (lbl) {
    lbl.textContent = pct + '%';
    lbl.classList.remove('pop');
    void lbl.offsetWidth;
    lbl.classList.add('pop');
  }
  if (fill && slider) {
    const min = parseFloat(slider.min), max = parseFloat(slider.max);
    const ratio = (pct - min) / (max - min);
    fill.style.width = (ratio * 100) + '%';
  }
}
