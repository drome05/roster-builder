const ROLE_MAP = {
  DUELIST:'duelist', DUEL:'duelist', DUP:'duelist',
  CTRL:'controller', CONTROLLER:'controller', CONT:'controller',
  SENTI:'sentinel',  SENTINEL:'sentinel',     SENT:'sentinel',
  INI:'initiator',   INITIATOR:'initiator',   INIT:'initiator',
  FLEX:'flex',
};

function canonRole(r) { return ROLE_MAP[(r||'').toUpperCase()] || null; }

function getRoleCounts(team) {
  const counts = { duelist:0, controller:0, sentinel:0, initiator:0, flex:0 };
  team.forEach(p => {
    if (!p.isPLT) { const c = canonRole(p.role); if (c) counts[c]++; }
  });
  return counts;
}

// Flex satisfies role slots — but respects flexRoles restrictions if set
function satisfiesComp(team, req) {
  const total = Object.values(req).reduce((a,b)=>a+b,0);
  if (total === 0) return true;

  const dedicated = { duelist:0, controller:0, sentinel:0, initiator:0 };
  // flexPool: array of {canFill: Set of roles} for each flex player
  const flexPool = [];

  team.forEach(p => {
    if (p.isPLT) return;
    const c = canonRole(p.isPLT ? '—' : p.role);
    if (c === 'flex') {
      // If flexRoles set, they can only fill those specific roles; otherwise any
      const canFill = p.flexRoles
        ? new Set(p.flexRoles.map(r => canonRole(r)).filter(Boolean))
        : new Set(['duelist','controller','sentinel','initiator']);
      flexPool.push(canFill);
    } else if (c) {
      dedicated[c]++;
    }
  });

  // Greedy: for each required role, fill with dedicated first, then try flex
  const unmet = {};
  for (const role of ['duelist','controller','sentinel','initiator']) {
    const need = req[role] || 0;
    const have = dedicated[role];
    if (have < need) unmet[role] = need - have;
  }

  if (Object.keys(unmet).length === 0) return true;

  // Try to assign flex players to unmet roles
  const usedFlex = new Set();
  for (const [role, count] of Object.entries(unmet)) {
    let filled = 0;
    for (let i = 0; i < flexPool.length; i++) {
      if (usedFlex.has(i)) continue;
      if (flexPool[i].has(role)) {
        usedFlex.add(i);
        filled++;
        if (filled >= count) break;
      }
    }
    if (filled < count) return false;
  }
  return true;
}

const roleReq = { duelist:0, controller:0, sentinel:0, initiator:0 };
let rolesSort = 'rem', rolesDir = 1;

function stepRole(role, delta) {
  const total = Object.values(roleReq).reduce((a,b)=>a+b,0);
  const next  = roleReq[role] + delta;
  if (next < 0) return;
  if (delta > 0 && total >= CFG.rosterSize) return;
  roleReq[role] = next;
  updateRolePickerUI();
  renderRoles();
}

function resetRolePicker() {
  Object.keys(roleReq).forEach(k => roleReq[k] = 0);
  updateRolePickerUI();
  renderRoles();
}

function updateRolePickerUI() {
  const total = Object.values(roleReq).reduce((a,b)=>a+b,0);
  Object.keys(roleReq).forEach(k => {
    const el = document.getElementById('rc-' + k);
    if (el) el.textContent = roleReq[k];
  });
  const lbl = document.getElementById('role-total-lbl');
  if (lbl) {
    lbl.textContent = `Total: ${total} / ${CFG.rosterSize}`;
    lbl.style.color = total === CFG.rosterSize ? 'var(--green)' : total > CFG.rosterSize ? 'var(--red-err)' : 'var(--muted)';
  }
  const err = document.getElementById('role-picker-error');
  if (err) {
    err.style.display = total > CFG.rosterSize ? 'block' : 'none';
    if (total > CFG.rosterSize) err.textContent = `Total exceeds roster size of ${CFG.rosterSize}.`;
  }
}

function sortRoles(k) { if (rolesSort===k) rolesDir*=-1; else { rolesSort=k; rolesDir=1; } renderRoles(); }

function renderRoles() {
  if (!PLAYERS.length && !PROMO_PLAYERS.length) {
    document.getElementById('roles-info').innerHTML = 'Configure players in the <strong>Setup</strong> tab first.';
    document.getElementById('roles-body').innerHTML = '';
    document.getElementById('roles-count').textContent = '';
    return;
  }

  const total  = Object.values(roleReq).reduce((a,b)=>a+b,0);
  const active = total > 0 && total <= CFG.rosterSize;
  const roleColors = { duelist:'#F87171', controller:'#60A5FA', sentinel:'#34D399', initiator:'#FBBF24', flex:'#A78BFA' };

  document.getElementById('roles-info').innerHTML = active
    ? 'Showing combos that match: ' + Object.entries(roleReq).filter(([,v])=>v>0)
        .map(([k,v])=>`<strong style="color:${roleColors[k]}">${v} ${k}</strong>`).join(', ') +
        ' <span style="color:var(--muted);font-size:10px">(Flex counts toward any role)</span>'
    : `Set a comp above to filter valid rosters. Flex players fill any role slot.`;

  let combos = getValidCombos();
  if (active) combos = combos.filter(c => satisfiesComp(c.team, roleReq));

  combos = [...combos].sort((a,b) => {
    if (rolesSort==='rem'||rolesSort==='total') return rolesDir*(b[rolesSort]-a[rolesSort]);
    return rolesDir*(getRoleCounts(b.team)[rolesSort]||0) - (getRoleCounts(a.team)[rolesSort]||0);
  });

  document.getElementById('roles-count').textContent =
    `${combos.length} roster${combos.length!==1?'s':''} match${combos.length===1?'es':''} this comp`;

  document.getElementById('roles-body').innerHTML = combos.map((c,i) => {
    const rc    = getRoleCounts(c.team);
    const names = c.team.map(p => {
      const col = p.isPLT ? 'var(--gold)' : (roleColors[canonRole(p.role)] || 'var(--muted)');
      const lbl = p.isPLT ? (p.label||'Promo Player') : p.name;
      return `<span class="tag" style="background:${p.isPLT?'rgba(201,168,76,0.15)':'var(--dark3)'};color:${col}">${lbl}</span>`;
    }).join('');
    const remCol = c.rem<=5?'#C07070':c.rem<=20?'#C9A84C':'#7DB87D';

    function rcell(key) {
      const n = rc[key]||0;
      const needed = roleReq[key]||0;
      const ok = !active || n >= needed;
      return `<td style="font-family:'DM Mono',monospace;text-align:center;font-weight:${n?'500':'300'};color:${n?(ok?roleColors[key]:'var(--muted)'):'var(--border2)'}">${n||'—'}</td>`;
    }

    return `<tr>
      <td style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px">${i+1}</td>
      <td>${names}${duoTag(c)}${badDuoTag(c)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:500">${c.total}</td>
      <td style="font-family:'DM Mono',monospace;color:${remCol}">${c.rem}</td>
      ${rcell('duelist')}${rcell('controller')}${rcell('sentinel')}${rcell('initiator')}${rcell('flex')}
    </tr>`;
  }).join('') || '<tr><td colspan="9" class="no-players-msg">No combos match this comp.</td></tr>';
}


// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  DUOS & LOCKED PLAYERS
