// Headless balance simulator. Run with `npm run sim [games]`.
// One bot per engine colour, per pair of colours, plus baselines.
// Override section sizes with SEC=6/14/30/50/60.
import { CARDS, COLUMNS, type Color } from './cards';
import { estimate, pickNext } from './auto';
import { CONFIG, cashLeft, newGame, priceOf, reduce, totalWork, type GameState } from './engine';

declare const process: { argv: string[]; env: Record<string, string | undefined> };

interface Policy {
  name: string;
  /** Engine colours this bot buys from. Site is always allowed. */
  colors: Color[];
  /** Day on which the bot stops valuing Cash and starts valuing Work. */
  pivot: number;
  /** Highest Yard row the bot will buy from (0-2). */
  maxRow: number;
  buys: boolean;
  thin: boolean;
  /** Play in a sensible order (true) or left to right like the Play-all button (false). */
  smart: boolean;
  /** Commit to the colour: prefer the most expensive card on offer over the estimate. */
  greedy?: boolean;
}

/** Which card to toss, or undefined to keep everything. */
function tossTarget(s: GameState, from: number[], p: Policy): number | undefined {
  const spl = from.find((x) => s.cards[x] === 'splinter');
  if (spl !== undefined) return spl;
  if (!p.thin) return undefined;
  const all = [...s.deck, ...s.hand, ...s.played, ...s.discard];
  if (all.length <= 6) return undefined;
  const jobs = all.filter((x) => s.cards[x] === 'odd_job').length;
  const nails = from.find((x) => s.cards[x] === 'nails');
  const job = from.find((x) => s.cards[x] === 'odd_job');
  // Keep enough Odd Jobs to shop with until late; Nails go first.
  if (nails !== undefined) return nails;
  if (job !== undefined && (s.day >= p.pivot + 3 || jobs > 4)) return job;
  return undefined;
}

function playTurn(s0: GameState, p: Policy): GameState {
  let s = s0;
  for (let guard = 0; guard < 300; guard++) {
    if (s.pendingToss > 0) {
      const t = tossTarget(s, s.hand, p);
      s = t !== undefined ? reduce(s, { type: 'toss', id: t }) : reduce(s, { type: 'skipToss' });
      continue;
    }
    const pick = p.smart ? pickNext(s) : s.hand[0];
    if (pick === undefined) break;
    const next = reduce(s, { type: 'play', id: pick });
    if (next === s) break;
    s = next;
  }
  // Buy: value each option by what it adds to an average day of this deck.
  const daysLeft = CONFIG.maxDays - s.day;
  if (p.buys && daysLeft >= 1) {
    for (let guard = 0; guard < 6; guard++) {
      const early = s.day < p.pivot;
      const base = estimate(s, undefined, 50);
      let best: { v: number; pile: number } | null = null;
      s.piles.forEach((pile, i) => {
        const d = CARDS[pile.def];
        if (pile.left <= 0 || priceOf(pile) > cashLeft(s) || pile.row > p.maxRow) return;
        const have = (id: string) => Object.values(s.cards).filter((x) => x === id).length;
        const isToss = (d.specials ?? []).some((x) => x.kind === 'toss');
        if (isToss && have(d.id) >= 1) return;
        // Everyone may buy a little gold; otherwise stay in colour.
        const gold = d.color === 'business' && pile.row === 0 && have(d.id) < 2;
        if (d.color !== 'site' && !p.colors.includes(d.color) && !gold) return;
        const e = estimate(s, pile.def, 50);
        let v = (e.work - base.work) * (early ? 0.7 : 1.4) + (e.cash - base.cash) * (early ? 1.3 : 0.3);
        if (isToss && p.thin && s.day <= 6) v += 0.4;
        if (d.install?.daily?.cover) v += 0.3;
        if (d.install?.savings) v += 0.2;
        if (p.greedy && d.color !== 'site' && !gold) v += 3 * (pile.row + 1);
        // The standard opening: two gold cards before anything else.
        if (gold && s.day <= 3) v += 20;
        if (!best || v > best.v) best = { v, pile: i };
      });
      const b = best as { v: number; pile: number } | null;
      if (!b || b.v < 0.1) break;
      const next = reduce(s, { type: 'buy', pile: b.pile });
      if (next === s) break;
      s = next;
    }
  }
  s = reduce(s, { type: 'endDay' });
  // Clean-up after finishing a section.
  for (let guard = 0; guard < 10 && s.night; guard++) {
    const t = tossTarget(s, [...s.played, ...s.hand], p);
    s = t !== undefined ? reduce(s, { type: 'toss', id: t }) : reduce(s, { type: 'skipToss' });
  }
  return s;
}

function run(p: Policy, games: number) {
  let wins = 0;
  let progSum = 0;
  let bestSum = 0;
  let onSum = 0;
  let onN = 0;
  const byDay = new Array(CONFIG.maxDays).fill(0);
  const cum = new Array(CONFIG.maxDays).fill(0);
  let winDay = 0;
  for (let g = 0; g < games; g++) {
    let s = newGame(1000 + g * 7919);
    while (s.phase === 'play') s = playTurn(s, p);
    progSum += Math.min(1, s.progress / totalWork());
    bestSum += s.stats.best;
    const on = s.stats.byDay.findIndex((w) => w >= 20);
    if (on >= 0) { onSum += on + 1; onN++; }
    let acc = 0;
    for (let d = 0; d < CONFIG.maxDays; d++) { const w = s.stats.byDay[d] ?? 0; byDay[d] += w; acc += w; cum[d] += acc; }
    if (s.phase === 'won') { wins++; winDay += s.day; }
  }
  return {
    winRate: wins / games, avgProg: progSum / games, best: bestSum / games,
    on: onN ? onSum / onN : 0, onPct: onN / games, winDay: wins ? winDay / wins : 0,
    byDay: byDay.map((x: number) => x / games), cum: cum.map((x: number) => x / games),
  };
}

const games = Number(process.argv[2] ?? 150);
if (process.env.SEC) process.env.SEC.split('/').forEach((v, i) => { CONFIG.sections[i].work = Number(v); });
const engines = COLUMNS.filter((c) => c.id !== 'site').map((c) => c.id);
const short: Record<string, string> = { framing: 'Stack', tools: 'Multiply', crew: 'Draw', business: 'Money' };
const base: Policy = { name: '', colors: engines, pivot: 5, maxRow: 2, buys: true, thin: true, smart: true };
const policies: Policy[] = [
  { ...base, name: 'never buys', buys: false },
  { ...base, name: 'flat: $3 row only', maxRow: 0 },
  ...engines.map((c) => ({ ...base, name: `${short[c]} only`, colors: [c], greedy: true })),
  ...engines.flatMap((a, i) => engines.slice(i + 1).map((b) => ({ ...base, name: `${short[a]} + ${short[b]}`, colors: [a, b], greedy: true }))),
  { ...base, name: 'all four colours' },
  { ...base, name: 'all four, play-all order', smart: false },
  { ...base, name: 'all four, no thinning', thin: false },
];
const only = process.env.ONLY;

console.log(`sections ${CONFIG.sections.map((x) => x.work).join('/')} = ${totalWork()} Work, prices ${CONFIG.prices.join('/')}, ${games} games each\n`);
console.log(`${'bot'.padEnd(26)} ${'win'.padStart(5)} ${'built'.padStart(6)} ${'best'.padStart(5)} ${'on'.padStart(9)}   Work by day`);
for (const p of policies) {
  if (only && !p.name.toLowerCase().includes(only.toLowerCase())) continue;
  const r = run(p, games);
  const days = r.byDay.map((x: number) => String(Math.round(x)).padStart(3)).join('');
  const on = r.onPct > 0 ? `d${r.on.toFixed(1)} ${Math.round(100 * r.onPct)}%` : '-';
  console.log(`${p.name.padEnd(26)} ${(100 * r.winRate).toFixed(0).padStart(4)}% ${(100 * r.avgProg).toFixed(0).padStart(5)}% ${r.best.toFixed(0).padStart(5)} ${on.padStart(9)}  ${days}`);
}
console.log('\nwin = games won; built = average share of the deck finished; best = average best single day;');
console.log('on = average first day with 20+ Work, and share of games that reached it.');
