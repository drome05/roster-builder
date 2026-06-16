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
