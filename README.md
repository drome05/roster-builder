# VDC Roster Builder

A browser-based roster building tool for Valorant Draft Circuit (and similar leagues). No installs, no account, no backend - just download and open the file.

---

## Getting Started

[Open this link](https://drome05.github.io/roster-builder/), and start in the **Setup** tab. The other tabs are hidden until you hit **Apply & Build**.

---

## Setup Tab

Everything starts here. Fill this out once before you do anything else.

### Tier Config
- **Tier name** - whatever you want to call this roster (e.g. Apprentice, Masters)
- **MMR Cap** - the maximum total MMR allowed for a 5-player roster
- **Roster size** - defaults to 5, adjust if your tier is different

### Promo Lower Tier
Add a ghost "Promo Player" slot for a player being promoted from a lower tier. Give them a name, a role, and the MMR they count at in your tier. They'll show up as a selectable card in the Builder just like any real player.

### Adding Players

**One at a time** - fill in Name, MMR, Role, ACS, and KD then hit Add.

For Role, click the dropdown and pick one of: Duelist, Controller, Sentinel, Initiator, or Flex.

If you pick **Flex**, a pill selector expands underneath - click the roles they can *actually* play. This matters for the Role Breakdown tab. If you leave all pills unselected, they count as full flex (can fill any role).

**Bulk import (recommended)** - paste a stats block directly from your tracker. Hit the **?** button next to Bulk Import to see the exact format, but it's just: copy the whole block, paste it in. The tool reads name, ACS, kills, deaths, assists, and KD automatically. After it parses, each player shows up as a row where you type their MMR and pick their role before hitting **Add All**.

Format the tool expects (one value per line, no labels needed):
```
PlayerName#tag
1.24
256.57
256
207
110
1.24
```
Multiple players at once is fine - paste the whole team block.

Hit **Apply & Build** when your player list looks right. You can always come back to add or remove players.

---

## Builder Tab

Click player cards to build a roster manually. The cap bar at the top tracks your MMR used in real time and tells you when you have a valid roster. Cards that would put you over cap or exceed roster size are greyed out automatically.

---

## All Valid Combos Tab

Every possible roster combination under your MMR cap, automatically. Sorted by how much cap room is left (tightest first). Columns are clickable to re-sort by MMR, room, ACS, or KD. Use the search bar to filter by player name.

If you've set up duos in the Intangibles tab:
- **♥ tag** = good duo present, combo is boosted slightly
- **✕ tag** = bad duo present, combo is pushed to the bottom and dimmed

---

## Best by Stats Tab

Same valid combos but ranked by a composite score of ACS and KD. The top lineup gets ⭐. Each roster gets a grade (S / A / B / C) relative to the rest of the pool - so grades are always spread out regardless of how close the raw numbers are.

Good duo boost and bad duo penalty both affect the score and final ranking here too.

---

## Role Breakdown Tab

Use the **+/−** steppers to set a comp - e.g. 2 Duelist, 1 Controller, 1 Sentinel, 1 Initiator. Hit the stepper until the total matches your roster size, and the table instantly filters to only show combos that satisfy that comp.

Flex players fill shortfalls based on whatever roles you checked in their pill selector during Setup. A flex player with only INI and SENTI checked won't count toward a Duelist slot.

Reset the comp to see all valid combos with their role counts displayed.

---

## Intangibles Tab

Three tools for things stats don't capture.

### Good Duos
Link two players that work well together. Combos with both get a small score boost and a green ♥ tag across all tabs. Not enough to make a weak roster look strong, just enough to surface it when scores are close.

### Bad Duos
Link two players that don't mesh. Combos with both get pushed to the bottom of every ranking and dimmed with a red ✕ tag. They're still visible - just clearly deprioritized.

### Lock Players
Lock a player to only show combos that include them. Useful when you know someone is definitely on the roster and want to figure out who else fits. Applies instantly across all tabs. You can lock multiple players. Remove a lock anytime.

---

## Other Notes

- **Light/dark mode** - toggle in the top right corner
- **Promo player roles** - if your promo slot is a flex, the pill selector works the same way as regular players
- All data lives in the browser tab - nothing is saved between sessions, so keep your player list handy for re-importing

---

*Made by aziel*
