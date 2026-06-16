// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
let CFG = {
  tierName:   '',
  cap:        820,
  rosterSize: 5,
  bdeMmr:     145,
};

const SETTINGS = {
  autoApply:    false,
  confirmClear: true,
};

// Multi-promo-player list
let PROMO_PLAYERS = []; // [{id, label, mmr}]
let _promoIdSeq   = 1;

let PLAYERS = [];
let DUOS = [];      // [{a, b}] good duos
let BAD_DUOS = [];  // [{a, b}] bad duos — combos with both get pushed down
let LOCKED_PLAYERS = new Set(); // player names that MUST appear in every combo
let selected = new Set();

let allSort = 'rank', allDir = 1, allFilter = '';
let rankSort = 'score', rankDir = 1;

let SCOUTS = [];       // [{id, name, mmr, role, tier, status, notes, acs, kd}]
let _scoutIdSeq = 1;
let scoutSortKey = 'name', scoutSortDir = 1;
let scoutTierFilter    = '';
let scoutRoleFilter    = '';
let scoutStatusFilter  = '';
let _pendingScoutImport = null; // decoded data from URL hash


// ═══════════════════════════════════════════════════════════════
//  PROMO (PLT) HELPERS

const ROLE_COLORS = { DUELIST:'#F87171', CTRL:'#60A5FA', SENTI:'#34D399', INI:'#FBBF24', FLEX:'#A78BFA' };
const ROLE_LABELS = { DUELIST:'Duelist', CTRL:'Controller', SENTI:'Sentinel', INI:'Initiator', FLEX:'Flex', '':'—' };

const LS_KEY = 'vdc-roster-autosave';
