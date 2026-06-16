function sortRanked(k) { if (rankSort === k) rankDir *= -1; else { rankSort = k; rankDir = 1; } renderRanked(); }

function renderRanked() {
  if (!PLAYERS.length && !PROMO_PLAYERS.length) {
    document.getElementById('ranked-body').innerHTML = '<tr><td colspan="7" class="no-players-msg">Configure players in the Setup tab first.</td></tr>';
    return;
  }

  const combos = getValidCombos().filter(c => c.hasStats);
  const sorted = [...combos].sort((a, b) => rankDir * (duoBoostedScore(b) - duoBoostedScore(a)));

  if (!sorted.length) {
    document.getElementById('ranked-body').innerHTML = '<tr><td colspan="7" class="no-players-msg">No valid combos with stats — add ACS/KD data in Setup.</td></tr>';
    return;
  }

  const scores = sorted.map(c => duoBoostedScore(c));
  const minScore = Math.min(...scores), maxScore = Math.max(...scores);

  document.getElementById('ranked-body').innerHTML = sorted.map((c, i) => {
    const g     = grade(duoBoostedScore(c), minScore, maxScore);
    const names = c.team.map(p =>
      `<span class="tag" style="background:${p.isPLT ? 'rgba(201,168,76,0.15)' : 'var(--dark3)'};color:${p.isPLT ? 'var(--gold)' : 'var(--text)'}">${p.isPLT ? esc(p.label || 'Promo Player') : esc(p.name)}</span>`
    ).join('');
    return `<tr class="${i === 0 ? 'best' : ''}" style="${c.badDuoCount ? 'opacity:0.6' : ''}">
      <td style="color:var(--muted);font-family:'DM Mono',monospace;font-size:11px">${i === 0 ? '⭐' : i + 1}</td>
      <td>${names}${duoTag(c)}${badDuoTag(c)}</td>
      <td style="font-family:'DM Mono',monospace">${c.total}</td>
      <td style="font-family:'DM Mono',monospace;color:${c.avgAcs >= 220 ? '#7DB87D' : 'inherit'}">${c.avgAcs.toFixed(1)}</td>
      <td style="font-family:'DM Mono',monospace;color:${c.avgKd >= 1.1 ? '#7DB87D' : c.avgKd < 1 ? '#C07070' : 'inherit'}">${c.avgKd.toFixed(2)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:500">${duoBoostedScore(c).toFixed(1)}</td>
      <td><span class="bx ${g.c}">${g.l}</span></td>
    </tr>`;
  }).join('');
}


// ═══════════════════════════════════════════════════════════════
//  ROLE BREAKDOWN
