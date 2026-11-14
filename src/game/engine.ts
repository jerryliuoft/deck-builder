// Rules engine: a pure reducer over GameState with a seeded RNG. No UI imports.
//
// A day is a running calculation. Each card played changes the day's Work, Cash and Cover
// totals in order, so cards can double what came before, boost what comes next, or count
// what has already been played.
//
// Everything here can be done with real cards: nothing searches or counts the draw pile.
import { CARDS, COLUMNS, candidates, type CardDef, type HazardKind, type Tag, type TurnView, type Yield } from './cards';

// ---- Tunables (see DESIGN.md; tuned with `npm run sim`) ---------------------

export interface SectionDef { id: string; name: string; work: number; learn: string }

export const CONFIG = {
  maxDays: 14,
  handSize: 5,
  /** Price and pile size by Yard row (enabler, scaler, payoff). */
  prices: [3, 5, 8],
  copies: [5, 4, 2],
  /** Cash per day for each finished section. */
  income: 2,
  /** Cards you may toss when you finish a section. */
  cleanup: 2,
  sections: [
    { id: 'footings', name: 'Footings', work: 8, learn: 'Concrete pads below the frost line that carry the whole deck.' },
    { id: 'framing', name: 'Framing', work: 20, learn: 'Posts, beams and joists: the skeleton the boards sit on.' },
    { id: 'decking', name: 'Decking', work: 40, learn: 'The boards you actually walk on, gapped so water drains.' },
    { id: 'railing', name: 'Railing', work: 66, learn: 'Guards and balusters. Required once the deck is 30 inches up.' },
    { id: 'finish', name: 'Finish', work: 86, learn: 'Stairs, stain and sealer. Then the grill.' },
  ] as SectionDef[],
  /** Share of the deck a build on track has finished by the end of each day. */
  par: [0.01, 0.02, 0.03, 0.04, 0.06, 0.1, 0.14, 0.2, 0.28, 0.37, 0.5, 0.68, 0.85, 1],
};

export interface Hazard { kind: HazardKind; sev: number }

export const HAZARDS: Record<HazardKind, { name: string; each: string; text: (n: number) => string }> = {
  clear: { name: 'Clear Night', each: '', text: () => 'Nothing happens.' },
  rain: { name: 'Rain', each: '-2 Work tomorrow', text: (n) => `Tomorrow starts at -${2 * n} Work.` },
  inspector: { name: 'Inspector', each: '-$1 tomorrow', text: (n) => `Tomorrow starts at -$${n}.` },
  splinters: { name: 'Splinters', each: 'a Splinter in your hand', text: (n) => `${n} Splinter${n > 1 ? 's' : ''} stuck in your hand.` },
  termites: { name: 'Termites', each: '-3 progress', text: (n) => `Lose ${3 * n} progress on the current section.` },
};

// ---- State -------------------------------------------------------------------

export type Buff =
  | { kind: 'next'; mult: number; from: string }
  | { kind: 'again'; from: string };

export type Fx =
  | { type: 'gain'; id: number; from: string }
  | { type: 'hazard'; hazard: Hazard; taken: number }
  | { type: 'section'; index: number }
  | { type: 'shuffle' }
  | { type: 'install'; id: number }
  | { type: 'commit'; work: number }
  | { type: 'newDay'; day: number };

export interface Pile { def: string; left: number; row: number; col: number }

export interface GameState {
  seed: number;
  rng: number;
  day: number;
  cards: Record<number, string>;
  nextId: number;
  deck: number[]; // top of the pile is the END of the array
  hand: number[];
  played: number[];
  discard: number[];
  fixtures: number[]; // installed for good; no longer part of the card deck
  /** The Yard: 5 columns x 3 rows, fixed for the whole game. Index = col * 3 + row. */
  piles: Pile[];
  progress: number;
  hazards: Hazard[];
  /** Running totals for today. */
  work: number;
  cash: number;
  cover: number;
  spent: number;
  /** What each played card contributed, for display. */
  yields: Record<number, Yield>;
  buffs: Buff[];
  /** Carried into tomorrow's starting totals (rain, inspector, savings). */
  carry: { work: number; cash: number; draw: number };
  /** Free tosses from a card effect (from the hand). */
  /** Cards bought today, face up on top of the draw pile: you draw them tomorrow. */
  fresh: number[];
  pendingToss: number;
  /** Clean-up tosses left after finishing a section (from played cards or the hand). */
  cleanup: number;
  /** True between committing today's Work and nightfall, while Clean-up is pending. */
  night: boolean;
  phase: 'play' | 'won' | 'lost';
  /** Scratch states used for estimates never create cards or ask for choices. */
  dry?: boolean;
  fx: Fx[];
  fxSeq: number;
  stats: { bought: string[]; tossed: number; blocked: number; taken: number; best: number; byDay: number[] };
}

export type Action =
  | { type: 'play'; id: number }
  | { type: 'playAll' }
  | { type: 'toss'; id: number }
  | { type: 'skipToss' }
  | { type: 'buy'; pile: number }
  | { type: 'endDay' };

// ---- RNG ---------------------------------------------------------------------

function rand(s: { rng: number }): number {
  // mulberry32
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function shuffle<T>(s: { rng: number }, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Derived values ----------------------------------------------------------

export const def = (s: GameState, id: number): CardDef => CARDS[s.cards[id]];

export function totalWork(): number {
  return CONFIG.sections.reduce((n, x) => n + x.work, 0);
}

/** Number of sections fully complete at a given progress value. */
export function sectionsDone(progress: number): number {
  let acc = 0;
  let n = 0;
  for (const sec of CONFIG.sections) {
    acc += sec.work;
    if (progress >= acc) n++;
  }
  return n;
}

/** Progress value at which section `i` starts. */
export function sectionStart(i: number): number {
  let acc = 0;
  for (let k = 0; k < i; k++) acc += CONFIG.sections[k].work;
  return acc;
}

/** Total Work a build on track has finished by the end of this day. */
export const parFor = (day: number): number => Math.round(totalWork() * CONFIG.par[Math.min(day, CONFIG.maxDays) - 1]);

export const owned = (s: GameState): number => s.deck.length + s.hand.length + s.played.length + s.discard.length;
export const cashLeft = (s: GameState): number => s.cash - s.spent;
export const workToday = (s: GameState): number => Math.max(0, s.work);
export const tonight = (s: GameState): Hazard => s.hazards[s.day - 1] ?? { kind: 'clear', sev: 0 };
export const priceOf = (p: Pile): number => CONFIG.prices[p.row];
/** Income from finished sections: +$2 a day each. */
export const income = (s: GameState): number => CONFIG.income * Math.min(sectionsDone(s.progress), CONFIG.sections.length - 1);

/** How much of tonight's hazard gets through as things stand. */
export function incoming(s: GameState): number {
  const hz = tonight(s);
  return hz.kind === 'clear' ? 0 : Math.max(0, hz.sev - s.cover);
}

export function handSize(s: GameState): number {
  let n = CONFIG.handSize;
  for (const id of s.fixtures) n += def(s, id).install?.daily?.draw ?? 0;
  return n;
}

export function isPlayable(s: GameState, id: number): boolean {
  return s.phase === 'play' && !s.night && s.pendingToss === 0 && s.hand.includes(id);
}

// ---- Setup -------------------------------------------------------------------

function makeHazards(s: GameState, tutorial: boolean): Hazard[] {
  const h = (kind: HazardKind, sev: number): Hazard => ({ kind, sev });
  const clear = h('clear', 0);
  const week1 = shuffle(s, [clear, clear, h('rain', 2), h('termites', 2), h('inspector', 2), h('splinters', 1)]);
  const week2 = shuffle(s, [clear, h('rain', 4), h('termites', 4), h('termites', 6), h('inspector', 4), h('splinters', 2)]);
  const all = [clear, ...week1, ...week2, clear];
  if (tutorial) {
    // Guarantee a teachable hazard on night 2.
    const i = all.findIndex((x) => x.kind === 'termites');
    [all[1], all[i]] = [all[i], all[1]];
  }
  return all.slice(0, CONFIG.maxDays);
}

export function newGame(seed: number, opts: { tutorial?: boolean } = {}): GameState {
  const s: GameState = {
    seed, rng: seed | 0, day: 1, cards: {}, nextId: 1,
    deck: [], hand: [], played: [], discard: [], fixtures: [], piles: [],
    progress: 0, hazards: [],
    work: 0, cash: 0, cover: 0, spent: 0, yields: {}, buffs: [],
    carry: { work: 0, cash: 0, draw: 0 },
    fresh: [], pendingToss: 0, cleanup: 0, night: false,
    phase: 'play', fx: [], fxSeq: 0,
    stats: { bought: [], tossed: 0, blocked: 0, taken: 0, best: 0, byDay: [] },
  };
  const mint = (d: string) => { const id = s.nextId++; s.cards[id] = d; return id; };
  // Fixed opening: the first two hands are each 3 Odd Jobs and 2 Nails. No opening luck.
  for (let hand = 0; hand < 2; hand++) {
    s.deck.push(mint('nails'), mint('nails'), mint('odd_job'), mint('odd_job'), mint('odd_job'));
  }
  s.hazards = makeHazards(s, !!opts.tutorial);
  // The Yard: one card per cell, chosen once. The tutorial always uses the first candidate.
  COLUMNS.forEach((c, col) => {
    for (let row = 0; row < 3; row++) {
      const opts2 = candidates(c.id, row + 1);
      const pick = opts.tutorial ? opts2[0] : opts2[Math.floor(rand(s) * opts2.length)];
      s.piles.push({ def: pick.id, left: CONFIG.copies[row], row, col });
    }
  });
  startDay(s);
  s.fx = [{ type: 'newDay', day: 1 }];
  return s;
}

function draw(s: GameState, n: number) {
  for (let i = 0; i < n; i++) {
    if (s.deck.length === 0) {
      if (s.discard.length === 0) return;
      s.deck = shuffle(s, s.discard);
      s.discard = [];
      s.fx.push({ type: 'shuffle' });
    }
    s.hand.push(s.deck.pop()!);
  }
}

function gain(s: GameState, defId: string, from: string, to: 'discard' | 'hand' | 'deck'): void {
  if (s.dry) return;
  const id = s.nextId++;
  s.cards[id] = defId;
  s[to].push(id);
  s.fx.push({ type: 'gain', id, from });
}

/** Set the day's starting totals and draw up to hand size. Unplayed cards were kept. */
export function startDay(s: GameState) {
  s.work = s.carry.work;
  s.cash = s.carry.cash + income(s);
  s.cover = 0;
  s.buffs = [];
  for (const id of s.fixtures) {
    const ins = def(s, id).install;
    if (!ins) continue;
    s.work += ins.daily?.work ?? 0;
    s.cash += ins.daily?.cash ?? 0;
    s.cover += ins.daily?.cover ?? 0;
    if (ins.again) s.buffs.push({ kind: 'again', from: def(s, id).name });
  }
  s.spent = 0;
  s.yields = {};
  s.fresh = [];
  const extra = s.carry.draw;
  s.carry = { work: 0, cash: 0, draw: 0 };
  draw(s, Math.max(0, handSize(s) - s.hand.length) + extra);
}

// ---- Playing a card ------------------------------------------------------------

function view(s: GameState, before: number[]): TurnView {
  const defs = before.map((id) => def(s, id));
  return {
    before: defs,
    work: Math.max(0, s.work),
    cash: Math.max(0, cashLeft(s)),
    cover: s.cover,
    last: before.length ? s.yields[before[before.length - 1]]?.work ?? 0 : 0,
    lastTwo: before.slice(-2).reduce((n, id) => n + (s.yields[id]?.work ?? 0), 0),
    handLeft: s.hand.length,
    n: (tag: Tag) => defs.reduce((k, d) => k + (d.tags.includes(tag) ? d.weight ?? 1 : 0), 0),
  };
}

function resolve(s: GameState, id: number, before: number[]) {
  const d = def(s, id);
  const y = { work: d.work ?? 0, cash: d.cash ?? 0, cover: d.cover ?? 0 };
  const extra = d.calc ? d.calc(view(s, before)) : {};
  y.work += extra.work ?? 0;
  y.cash += extra.cash ?? 0;
  y.cover += extra.cover ?? 0;
  if (d.install?.daily) {
    y.work += d.install.daily.work ?? 0;
    y.cash += d.install.daily.cash ?? 0;
    y.cover += d.install.daily.cover ?? 0;
  }
  // Standing bonuses from installed fixtures.
  for (const f of s.fixtures) {
    const a = def(s, f).install?.aura;
    if (a && d.tags.includes(a.tag)) y.work += a.work;
  }
  // "Your next card gives double."
  const i = s.buffs.findIndex((b) => b.kind === 'next');
  if (i >= 0) {
    const b = s.buffs[i] as Extract<Buff, { kind: 'next' }>;
    y.work *= b.mult;
    y.cash *= b.mult;
    y.cover *= b.mult;
    s.buffs.splice(i, 1);
  }
  s.work += y.work;
  s.cash += y.cash;
  s.cover += y.cover;
  const prev = s.yields[id] ?? { work: 0, cash: 0, cover: 0 };
  s.yields[id] = { work: (prev.work ?? 0) + y.work, cash: (prev.cash ?? 0) + y.cash, cover: (prev.cover ?? 0) + y.cover };

  if (d.draw) draw(s, d.draw);
  for (const sp of d.specials ?? []) {
    switch (sp.kind) {
      case 'toss':
        if (!s.dry && s.hand.length > 0) s.pendingToss = Math.min(s.pendingToss + sp.n, s.hand.length);
        break;
      case 'tomorrow':
        s.carry.draw += sp.draw ?? 0;
        s.carry.work += sp.work ?? 0;
        s.carry.cash += sp.cash ?? 0;
        break;
      case 'next':
        s.buffs.push({ kind: 'next', mult: sp.mult, from: d.name });
        break;
      case 'again':
        s.buffs.push({ kind: 'again', from: d.name });
        break;
      case 'fetchDiscard': {
        let best = -1;
        const rank = (x: number) => (def(s, x).row ?? 0);
        for (let k = s.discard.length - 1; k >= 0; k--) {
          if (best < 0 || rank(s.discard[k]) > rank(s.discard[best])) best = k;
        }
        if (best >= 0) s.hand.push(...s.discard.splice(best, 1));
        break;
      }
      case 'selfToss':
        break; // handled by playCard
    }
  }
}

/** Play one card from the hand. Mutates `s`. */
export function playCard(s: GameState, id: number) {
  const d = def(s, id);
  const before = [...s.played];
  // "Play your next card twice" is consumed by the card that follows it.
  const again = s.buffs.findIndex((b) => b.kind === 'again');
  const times = again >= 0 ? 2 : 1;
  if (again >= 0) s.buffs.splice(again, 1);
  s.hand = s.hand.filter((x) => x !== id);
  s.played.push(id);
  for (let k = 0; k < times; k++) resolve(s, id, before);
  if (d.install) {
    // Installed for good: it leaves the card deck and keeps working every day.
    s.played = s.played.filter((x) => x !== id);
    s.fixtures.push(id);
    s.fx.push({ type: 'install', id });
  } else if ((d.specials ?? []).some((x) => x.kind === 'selfToss')) {
    s.played = s.played.filter((x) => x !== id);
    s.stats.tossed++;
  }
}

// ---- End of day ----------------------------------------------------------------

/** Commit today's Work. Returns true if the day should pause for Clean-up. */
function commit(s: GameState): boolean {
  s.pendingToss = 0;
  if (s.fixtures.some((id) => def(s, id).install?.savings)) s.work = Math.max(0, s.work) + 2 * Math.max(0, cashLeft(s));
  const before = sectionsDone(s.progress);
  const work = workToday(s);
  const total = totalWork();
  s.stats.best = Math.max(s.stats.best, work);
  s.stats.byDay[s.day - 1] = work;
  s.progress = Math.min(total, s.progress + work);
  s.work = 0;
  s.fx.push({ type: 'commit', work });
  const after = sectionsDone(s.progress);
  for (let i = before; i < after; i++) s.fx.push({ type: 'section', index: i });
  if (s.progress >= total) {
    s.phase = 'won';
    return false;
  }
  const finished = after - before;
  if (finished > 0 && !s.dry && s.played.length + s.hand.length > 0) {
    s.cleanup = CONFIG.cleanup * finished;
    s.night = true;
    return true;
  }
  return false;
}

function nightfall(s: GameState) {
  s.night = false;
  s.cleanup = 0;
  // Tonight's hazard: Cover blocks it point for point.
  const hz = tonight(s);
  if (hz.kind !== 'clear') {
    const taken = Math.max(0, hz.sev - s.cover);
    s.stats.blocked += hz.sev - taken;
    s.stats.taken += taken;
    s.fx.push({ type: 'hazard', hazard: hz, taken });
    if (taken > 0) {
      const floor = sectionStart(sectionsDone(s.progress));
      switch (hz.kind) {
        case 'rain': s.carry.work -= 2 * taken; break;
        case 'inspector': s.carry.cash -= taken; break;
        case 'splinters': for (let i = 0; i < taken; i++) gain(s, 'splinter', 'hazard', 'hand'); break;
        case 'termites': s.progress = Math.max(floor, s.progress - 3 * taken); break;
      }
    }
  }

  if (s.day >= CONFIG.maxDays) {
    s.phase = 'lost';
    return;
  }

  // Played cards are discarded. Unplayed cards stay in your hand.
  s.discard.push(...s.played);
  s.played = [];
  s.day++;
  s.fx.push({ type: 'newDay', day: s.day });
  startDay(s);
}

/** Apply an action. Returns a new state; illegal actions return the same state. */
export function reduce(prev: GameState, a: Action): GameState {
  if (prev.phase !== 'play') return prev;
  const s: GameState = structuredClone(prev);
  s.fx = [];
  let ok = false;
  if (s.night) {
    // Clean-up: toss cards you played today or still hold, then night falls.
    if (a.type === 'toss' && s.cleanup > 0 && (s.played.includes(a.id) || s.hand.includes(a.id))) {
      s.played = s.played.filter((x) => x !== a.id);
      s.hand = s.hand.filter((x) => x !== a.id);
      s.stats.tossed++;
      s.cleanup--;
      if (s.cleanup === 0 || s.played.length + s.hand.length === 0) nightfall(s);
      ok = true;
    } else if (a.type === 'skipToss' || a.type === 'endDay') {
      nightfall(s);
      ok = true;
    }
  } else {
    switch (a.type) {
      case 'play':
        if (isPlayable(s, a.id)) { playCard(s, a.id); ok = true; }
        break;
      case 'playAll':
        // Left to right, exactly as the hand is laid out. Stops when a card needs a choice.
        while (s.pendingToss === 0 && s.hand.length > 0) {
          playCard(s, s.hand[0]);
          ok = true;
        }
        break;
      case 'toss':
        if (s.pendingToss > 0 && s.hand.includes(a.id)) {
          s.hand = s.hand.filter((x) => x !== a.id);
          s.pendingToss = s.hand.length === 0 ? 0 : s.pendingToss - 1;
          s.stats.tossed++;
          ok = true;
        }
        break;
      case 'skipToss':
        if (s.pendingToss > 0) { s.pendingToss = 0; ok = true; }
        break;
      case 'buy': {
        const p = s.piles[a.pile];
        if (s.pendingToss === 0 && p && p.left > 0 && cashLeft(s) >= priceOf(p)) {
          s.spent += priceOf(p);
          p.left--;
          // Bought cards go on top of the draw pile: you will see them tomorrow.
          const id = s.nextId++;
          s.cards[id] = p.def;
          s.deck.push(id);
          s.fresh.push(id);
          s.fx.push({ type: 'gain', id, from: `pile:${a.pile}` });
          s.stats.bought.push(p.def);
          ok = true;
        }
        break;
      }
      case 'endDay':
        if (!commit(s) && s.phase === 'play') nightfall(s);
        ok = true;
        break;
    }
  }
  if (!ok) return prev;
  s.fxSeq = prev.fxSeq + 1;
  return s;
}
