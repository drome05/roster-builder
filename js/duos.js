const DUO_BOOST_PER_PAIR = 3;
const BAD_DUO_PENALTY    = 8;

function duoBoostedScore(c) {
  return c.score + c.duoBoost * DUO_BOOST_PER_PAIR - (c.badDuoCount||0) * BAD_DUO_PENALTY;
}

function duoTag(c) {
  if (!c.duoBoost) return '';
  return DUOS
    .filter(d => { const n=c.team.map(p=>p.name); return n.includes(d.a)&&n.includes(d.b); })
    .map(d=>`<span style="font-size:9px;font-family:'DM Mono',monospace;padding:1px 5px;border-radius:3px;background:rgba(100,180,120,0.12);color:#6ab478;margin-left:3px">\u2665 ${d.a.split('#')[0]}+${d.b.split('#')[0]}</span>`)
    .join('');
}

function badDuoTag(c) {
  if (!c.badDuoCount) return '';
  return BAD_DUOS
    .filter(d => { const n=c.team.map(p=>p.name); return n.includes(d.a)&&n.includes(d.b); })
    .map(d=>`<span style="font-size:9px;font-family:'DM Mono',monospace;padding:1px 5px;border-radius:3px;background:rgba(200,80,80,0.12);color:#C07070;margin-left:3px">\u2715 ${d.a.split('#')[0]}+${d.b.split('#')[0]}</span>`)
    .join('');
}

function populateDuoDrops() {
  const allP = allPlayersWithPLT().filter(p=>!p.isPLT);
  ['duo-a','duo-b','badduo-a','badduo-b','lock'].forEach(id => {
    const menu = document.getElementById(`${id}-menu`);
    if (!menu) return;
    menu.innerHTML = allP.map(p =>
      `<div class="role-drop-item" onclick="pickGenericRole('${id}-val','${id}-label','${p.name.replace(/'/g,"\\'")}','${id}-menu')">${p.name}</div>`
    ).join('') || '<div class="role-drop-item" style="color:var(--muted)">No players yet</div>';
  });
}

function validateDuoPick(aId, bId, errId, list) {
  const a=document.getElementById(`${aId}-val`).value, b=document.getElementById(`${bId}-val`).value;
  const errEl=document.getElementById(errId);
  if(!a||!b){errEl.textContent='Select both players.';errEl.style.display='block';return null;}
  if(a===b){errEl.textContent='Pick two different players.';errEl.style.display='block';return null;}
  if(list.find(d=>(d.a===a&&d.b===b)||(d.a===b&&d.b===a))){errEl.textContent='Already linked.';errEl.style.display='block';return null;}
  errEl.style.display='none'; return {a,b};
}

function resetDuoPicker(aId, bId) {
  ['a','b'].forEach((s,i)=>{
    const id=[aId,bId][i];
    pickGenericRole(`${id}-val`,`${id}-label`,'',`${id}-menu`);
    document.getElementById(`${id}-label`).textContent='Select player\u2026';
  });
}

// GOOD DUOS
function addDuo() {
  const pair=validateDuoPick('duo-a','duo-b','duo-error',DUOS); if(!pair) return;
  DUOS.push(pair); resetDuoPicker('duo-a','duo-b');
  autoSave(); renderDuoList(); rerenderCombos();
}
function removeDuo(idx){ DUOS.splice(idx,1); renderDuoList(); rerenderCombos(); }
function renderDuoList() {
  const el=document.getElementById('duo-list-container');
  el.innerHTML = !DUOS.length
    ? '<p style="font-size:11px;color:var(--muted);font-family:\'DM Mono\',monospace;font-style:italic">No good duos linked yet.</p>'
    : `<div style="display:flex;flex-direction:column;gap:6px">${DUOS.map((d,i)=>`
      <div class="pentry" style="border-color:rgba(100,180,120,0.25)">
        <span class="pe-name" style="color:#6ab478">\u2665</span>
        <span class="pe-name">${esc(d.a)}</span>
        <span style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px">+</span>
        <span class="pe-name">${esc(d.b)}</span>
        <span class="pe-del" onclick="removeDuo(${i})">\u2715</span>
      </div>`).join('')}</div>`;
}

// BAD DUOS
function addBadDuo() {
  const pair=validateDuoPick('badduo-a','badduo-b','badduo-error',BAD_DUOS); if(!pair) return;
  BAD_DUOS.push(pair); resetDuoPicker('badduo-a','badduo-b');
  autoSave(); renderBadDuoList(); rerenderCombos();
}
function removeBadDuo(idx){ BAD_DUOS.splice(idx,1); renderBadDuoList(); rerenderCombos(); }
function renderBadDuoList() {
  const el=document.getElementById('badduo-list-container');
  el.innerHTML = !BAD_DUOS.length
    ? '<p style="font-size:11px;color:var(--muted);font-family:\'DM Mono\',monospace;font-style:italic">No bad duos linked yet.</p>'
    : `<div style="display:flex;flex-direction:column;gap:6px">${BAD_DUOS.map((d,i)=>`
      <div class="pentry" style="border-color:rgba(200,80,80,0.25)">
        <span class="pe-name" style="color:#C07070">\u2715</span>
        <span class="pe-name">${esc(d.a)}</span>
        <span style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px">+</span>
        <span class="pe-name">${esc(d.b)}</span>
        <span class="pe-del" onclick="removeBadDuo(${i})">\u2715</span>
      </div>`).join('')}</div>`;
}

// LOCKED PLAYERS
function lockPlayer() {
  const val=document.getElementById('lock-val').value;
  const errEl=document.getElementById('lock-error');
  if(!val){errEl.textContent='Select a player.';errEl.style.display='block';return;}
  if(LOCKED_PLAYERS.has(val)){errEl.textContent='Already locked.';errEl.style.display='block';return;}
  if(LOCKED_PLAYERS.size>=CFG.rosterSize-1){errEl.textContent=`Can\'t lock more than ${CFG.rosterSize-1} players.`;errEl.style.display='block';return;}
  errEl.style.display='none';
  LOCKED_PLAYERS.add(val);
  pickGenericRole('lock-val','lock-label','','lock-menu');
  document.getElementById('lock-label').textContent='Select player\u2026';
  autoSave(); renderLockList(); rerenderCombos();
}
function unlockPlayer(name){ LOCKED_PLAYERS.delete(name); renderLockList(); rerenderCombos(); }
function renderLockList() {
  const el=document.getElementById('lock-list-container');
  const arr=[...LOCKED_PLAYERS];
  el.innerHTML = !arr.length
    ? '<p style="font-size:11px;color:var(--muted);font-family:\'DM Mono\',monospace;font-style:italic">No players locked yet.</p>'
    : `<div style="display:flex;flex-direction:column;gap:6px">${arr.map(name=>`
      <div class="pentry" style="border-color:rgba(201,168,76,0.3)">
        <span style="color:var(--gold);font-size:13px">\uD83D\uDD12</span>
        <span class="pe-name">${esc(name)}</span>
        <span style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;flex:1">must appear in every combo</span>
        <span class="pe-del" onclick="unlockPlayer('${name.replace(/'/g,"\\'")}')">\u2715</span>
      </div>`).join('')}</div>`;
}

function rerenderCombos() { renderAll(); renderRanked(); renderRoles(); }

function renderDuos() {
  populateDuoDrops();
  renderDuoList(); renderBadDuoList(); renderLockList();
}

//  TAB SWITCH
