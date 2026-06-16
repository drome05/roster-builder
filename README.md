# VDC Roster Builder

A browser-based roster building tool for Valorant Draft Circuit. No installs, no account, no backend.

---

## Getting Started

[Open this link](https://drome05.github.io/roster-builder/) and start in the **Setup** tab. The Builder, All Combos, Best by Stats, Role Breakdown, and Intangibles tabs stay hidden until you hit **Apply & Build**. Scouting and Settings are available right away, no setup required.

---

## Setup Tab

Everything starts here. Fill this out once before you do anything else.

### Tier Config
- **Tier name** - whatever you want to call this roster (e.g. Apprentice, Mythic)
- **MMR Cap** - the maximum total MMR allowed for a 5-player roster
- **Roster size** - defaults to 5, adjust if your tier is different

### Promo Lower Tier
Add as many "Promo Player" slots as you need for players being promoted from a lower tier. Give each one a name, a role, and the MMR they count at in your tier. They'll show up as a selectable ghost card in the Builder just like any real player, badged so you can tell them apart.

### Adding Players

Paste a stats block straight from the VDC website - go to your franchise's Team page, select the whole "Team Stats" table, copy, and paste it into the box. Hit the **?** button next to Players if you need a reminder of the format. The tool reads name, ACS, kills, deaths, assists, and KD automatically.

For example, copying a table like this:

| NAME | RATING | ACS | K | D | A | KD |
|---|---|---|---|---|---|---|
| arceus#0505 | 1.21 | 236.26 | 417 | 341 | 109 | 1.22 |
| Thunder#229 | 1.27 | 225.05 | 354 | 282 | 96 | 1.26 |

...pastes in as one value per line, no labels needed:
```
arceus#0505
1.21
236.26
417
341
109
1.22
Thunder#229
1.27
225.05
354
282
96
1.26
```
Multiple players at once is fine - paste the whole team block and the tool will split it back out into individual players.

After it parses, each player shows up as a row with their detected stats. Type their MMR and pick their Role for each one before hitting **Add All with MMR**. If you pick **Flex** for a player, a pill selector expands underneath their row - click the roles they can *actually* play. This matters for the Role Breakdown tab. If you leave all pills unselected, they count as full flex (can fill any role).

### Saving and Loading

Your work now auto-saves to the browser as you go, so closing the tab and coming back later won't lose anything. That said, exporting is still the way to back things up properly or hand a roster off to another GM - hit **Export** in the Players section (it's also pinned to the header once you've built a roster, for quick access from any tab) and it downloads a `.json` file named after your tier - `Apprentice.json`, `Mythic.json`, whatever you set. Hit **Import** next to it to load a file back in - players, roles, duos, locks, promo players, all of it.

If you want a clean slate instead of carrying over the auto-saved session, head to **Settings** and use **Clear saved data**.

Hit **Apply & Build** when your player list looks right. You can always come back to add or remove players.

---

## Builder Tab

Click player cards to build a roster manually. Each card shows a Valorant agent portrait based on the player's role (promo players get a gold "PLT" badge instead). The cap bar at the top tracks your MMR used in real time and tells you when you have a valid roster. Cards that would put you over cap or exceed roster size are greyed out automatically.

Once you have a valid 5-player roster, a **📋 Copy for Discord** button appears in the header - one click and a clean formatted message is in your clipboard, ready to paste straight into GM chat.

---

## All Valid Combos Tab

Every possible roster combination under your MMR cap, automatically. Sorted by how much cap room is left (tightest first). Columns are clickable to re-sort by MMR, room, ACS, or KD. Use the search bar to filter by player name.

If you've set up duos in the Intangibles tab:
- **♥ tag** - good duo present, combo is boosted slightly
- **✕ tag** - bad duo present, combo is pushed to the bottom and dimmed

---

## Best by Stats Tab

Same valid combos but ranked by a composite score of ACS and KD. The top lineup gets ⭐. Each roster gets a grade (S / A / B / C) relative to the rest of the pool - so grades are always spread out regardless of how close the raw numbers are.

Good duo boost and bad duo penalty both affect the score and final ranking here too.

---

## Role Breakdown Tab

Use the **+/-** steppers to set a comp - e.g. 2 Duelist, 1 Controller, 1 Sentinel, 1 Initiator. The table instantly filters to only show combos that satisfy that comp.

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

## Scouting Tab

A board for tracking players you don't have yet - separate from your tier's player pool, and available before you've even run Setup.

### Adding a scout
Fill in Name, MMR, Role, Tier (Recruit / Prospect / Apprentice / Expert / Mythic), ACS, K/D, Notes, and Status, then hit **+ Scout Player**. Status defaults to **RFA** and cycles through four options - click the status badge in the table anytime to cycle it:
- **Signed** - already on a team
- **RFA** - sub only
- **DE** - draft eligible
- **DND** - pass

### The board
Filter by tier using the tabs above the table, or click any column header to sort. Each row has a **Sim** button and a remove (✕) button.

**Sim** checks whether the scouted player could actually fit on your built roster: it temporarily slots them into your player pool, runs the combo math against your current cap, locks, and roster size, and shows you the best valid lineup that includes them (or tells you why none exists). You need a roster built in Setup first for this to work.

### Sharing a scout board
Hit **Share Board** to copy a link to your clipboard. Anyone who opens that link gets a banner offering to import your scouts into their own board - it merges in, skipping anyone they already have by name. Nothing touches a server; the whole list is just encoded into the link itself.

---

## Settings

Settings now lives as its own tab in the sidebar, always available no matter what else you're doing.

- **Session Data** - your progress auto-saves locally as you work. Hit **Clear saved data** to wipe it and start fresh.
- **Theme** - switch between dark and light mode
- **Auto-apply on import** - skip the review step and go straight to Builder after importing a JSON file
- **Confirm before clear** - shows a clean in-app dialog before wiping your player list

---

## Other Notes

- **Promo player roles** - if a promo slot is a flex, the pill selector works the same way as regular players
- Your session auto-saves in the browser, but nothing is ever sent anywhere - export a `.json` if you want a real backup or want to hand a roster to another GM
- Scout board sharing works the same way: the data lives in the link itself, not on a server
- Nothing leaves your browser, no tracking, no backend

---

*With love from aziel, for the VDC community.*
