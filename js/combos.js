function sortAll(k)   { if (allSort === k) allDir *= -1; else { allSort = k; allDir = 1; } renderAll(); }
function filterAll(v) { allFilter = v.toLowerCase(); renderAll(); }

function renderAll() {
  if (!PLAYERS.length && !PROMO_PLAYERS.length) {
    document.getElementById('all-info').innerHTML     = 'Configure players in the <strong>Setup</strong> tab first.';
    document.getElementById('all-body').innerHTML     = '';
    document.getElementById('combo-count').textContent = '';
    return;
  }

  document.getElementById('all-info').innerHTML = `All valid ${CFG.rosterSize}-player combos under <strong>${CFG.cap} MMR</strong>. Sorted by cap efficiency. PLT = Promo Lower Tier.`;

  const combos = getValidCombos();
  let list = allFilter
    ? combos.filter(c => c.team.some(p => (p.isPLT ? (p.label || 'promo player') : p.name).toLowerCase().includes(allFilter)))
    : combos;

  list = [...list].sort((a, b) => {
    if (allSort === 'rank') {
      // Bad duos always go below clean combos
      if (a.badDuoCount !== b.badDuoCount) return a.badDuoCount - b.badDuoCount;
      const remDiff = allDir < 0 ? b.rem - a.rem : a.rem - b.rem;
      return remDiff !== 0 ? remDiff : b.duoBoost - a.duoBoost;
    }
    return allDir * (b[allSort] - a[allSort]);
  });
  list.forEach((c, i) => c.rank = i + 1);

  document.getElementById('combo-count').textContent =
    `${list.length} valid roster${list.length !== 1 ? 's' : ''} under ${CFG.cap} MMR`;

  document.getElementById('all-body').innerHTML = list.map((c, i) => {
    const names = c.team.map(p =>
      `<span class="tag" style="background:${p.isPLT ? 'rgba(201,168,76,0.15)' : 'var(--dark3)'};color:${p.isPLT ? 'var(--gold)' : 'var(--text)'}">${p.isPLT ? esc(p.label || 'Promo Player') : esc(p.name)}</span>`
    ).join('');
    const remCol = c.rem <= 5 ? '#C07070' : c.rem <= 20 ? '#C9A84C' : '#7DB87D';
    const rowStyle = c.badDuoCount ? 'opacity:0.6' : '';
    return `<tr style="${rowStyle}">
      <td style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px">${i + 1}</td>
      <td>${names}${duoTag(c)}${badDuoTag(c)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:500">${c.total}</td>
      <td style="font-family:'DM Mono',monospace;color:${remCol}">${c.rem}</td>
      <td style="font-family:'DM Mono',monospace;color:${c.avgAcs >= 220 ? '#7DB87D' : 'inherit'}">${c.hasStats ? c.avgAcs.toFixed(1) : '—'}</td>
      <td style="font-family:'DM Mono',monospace;color:${c.avgKd >= 1.1 ? '#7DB87D' : c.avgKd < 1 ? '#C07070' : 'inherit'}">${c.hasStats ? c.avgKd.toFixed(2) : '—'}</td>
    </tr>`;
  }).join('');
}


// ═══════════════════════════════════════════════════════════════
//  RANKED
