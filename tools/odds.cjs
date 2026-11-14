// Odds for the four proposed engines. Monte Carlo over a single day of a given deck.
// Card kinds (mechanics only):
//  J  junk-ish starter: Odd Job ($1)            N  Nails (1 Work)
//  L  Lumber: 2 Work +1 per Lumber before it     H  Hanger: +2 Work per Lumber before it
//  D  Doubler: double Work so far                P  Payload: 6 Work
//  C  Cantrip crew: +1 Work, draw 1              W  Draw 2
//  A  All Hands: +1 Work per card played before  S  Side Hustle ($2)
//  G  Pitch: double Cash so far                  X  Sub it out: +1 Work per $1 of Cash so far
const N_SIM = 40000;
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ORDER = { W: 0, C: 1, J: 2, S: 2, N: 3, L: 3, P: 3, H: 4, A: 5, G: 6, X: 7, D: 8 };

function day(deckStr, hand = 5) {
  const deck = shuffle(deckStr.split(''));
  const h = deck.splice(0, hand);
  let work = 0, cash = 0, lumber = 0, played = 0;
  for (;;) {
    if (!h.length) break;
    h.sort((a, b) => ORDER[a] - ORDER[b]);
    const c = h.shift();
    if (c === 'J') cash += 1;
    else if (c === 'S') cash += 2;
    else if (c === 'N') work += 1;
    else if (c === 'L') { work += 2 + lumber; lumber++; }
    else if (c === 'H') work += 2 * lumber;
    else if (c === 'P') work += 6;
    else if (c === 'D') work *= 2;
    else if (c === 'C') { work += 1; if (deck.length) h.push(deck.shift()); }
    else if (c === 'W') { for (let i = 0; i < 2; i++) if (deck.length) h.push(deck.shift()); }
    else if (c === 'A') work += played;
    else if (c === 'G') cash *= 2;
    else if (c === 'X') work += cash;
    played++;
  }
  return { work, cash, played };
}
function stat(deckStr, hand = 5) {
  let w = 0, c = 0, p = 0, big = 0, all = 0; const ws = [];
  for (let i = 0; i < N_SIM; i++) { const r = day(deckStr, hand); w += r.work; c += r.cash; p += r.played; ws.push(r.work); if (r.played >= deckStr.length) all++; }
  ws.sort((a, b) => a - b);
  return { work: (w / N_SIM).toFixed(1), cash: (c / N_SIM).toFixed(1), played: (p / N_SIM).toFixed(1), p90: ws[Math.floor(N_SIM * 0.9)], whole: Math.round((100 * all) / N_SIM) + '%' };
}
const rep = (ch, n) => ch.repeat(n);
const show = (title, rows) => { console.log('\n' + title); for (const [label, deck, hand] of rows) { const s = stat(deck, hand ?? 5); console.log(`  ${label.padEnd(46)} cards ${String(deck.length).padStart(2)}  work ${s.work.padStart(6)}  p90 ${String(s.p90).padStart(4)}  cash ${s.cash.padStart(5)}  played ${s.played.padStart(5)}  whole-deck ${s.whole}`); } };

const START = rep('J', 6) + rep('N', 4);
show('BASELINE', [['starting deck', START]]);

show('STACK (Lumber counts Lumber before it)', [
  ['start + 2 Lumber', START + 'LL'],
  ['start + 4 Lumber', START + 'LLLL'],
  ['start + 6 Lumber + 1 Hanger', START + 'LLLLLL' + 'H'],
  ['start + 8 Lumber + 2 Hanger', START + rep('L', 8) + 'HH'],
  ['thinned to 6 start + 8 Lumber + 2 Hanger', 'JJJNNN' + rep('L', 8) + 'HH'],
  ['same, hand of 7', 'JJJNNN' + rep('L', 8) + 'HH', 7],
  ['same + 3 draw-2, hand of 7', 'JJJNNN' + rep('L', 8) + 'HH' + 'WWW', 7],
]);

show('MULTIPLY (double Work so far)', [
  ['start + 1 Payload + 1 Doubler', START + 'PD'],
  ['start + 2 Payload + 2 Doubler', START + 'PPDD'],
  ['start + 3 Payload + 3 Doubler', START + 'PPPDDD'],
  ['thinned to 4 start + 3 Payload + 3 Doubler', 'JJNN' + 'PPPDDD'],
  ['thinned to 2 start + 3 Payload + 3 Doubler', 'JN' + 'PPPDDD'],
  ['3 Payload + 3 Doubler only, hand of 6', 'PPPDDD', 6],
  ['4 Payload + 4 Doubler only, hand of 6', 'PPPPDDDD', 6],
]);

show('DRAW (cantrips + draw-2, payoff counts cards played)', [
  ['start + 2 cantrip + 1 All Hands', START + 'CC' + 'A'],
  ['start + 4 cantrip + 2 draw-2 + 1 All Hands', START + 'CCCC' + 'WW' + 'A'],
  ['start + 6 cantrip + 4 draw-2 + 2 All Hands', START + rep('C', 6) + 'WWWW' + 'AA'],
  ['start + 6 cantrip + 6 draw-2 + 3 All Hands', START + rep('C', 6) + rep('W', 6) + 'AAA'],
  ['thinned to 4 start + 6 cantrip + 6 draw-2 + 3 AH', 'JJNN' + rep('C', 6) + rep('W', 6) + 'AAA'],
]);

show('MONEY (double Cash so far, then turn Cash into Work)', [
  ['start + 2 Side Hustle', START + 'SS'],
  ['start + 4 Side Hustle + 1 Pitch', START + 'SSSS' + 'G'],
  ['start + 4 Side Hustle + 2 Pitch + 1 Sub-out', START + 'SSSS' + 'GG' + 'X'],
  ['no Nails: 6 Odd Job + 5 Side Hustle + 2 Pitch + 2 Sub', rep('J', 6) + rep('S', 5) + 'GG' + 'XX'],
  ['same, hand of 7', rep('J', 6) + rep('S', 5) + 'GG' + 'XX', 7],
]);

show('HYBRIDS', [
  ['Draw + Multiply: 4 start, 6 cantrip, 4 draw-2, 3 P, 3 D', 'JJNN' + rep('C', 6) + 'WWWW' + 'PPP' + 'DDD'],
  ['Stack + Multiply: 4 start, 8 Lumber, 2 Hanger, 2 D', 'JJNN' + rep('L', 8) + 'HH' + 'DD'],
]);

// Hypergeometric: chance a 5-card hand holds at least one of k key cards.
const C = (n, r) => { if (r < 0 || r > n) return 0; let x = 1; for (let i = 0; i < r; i++) x = (x * (n - i)) / (i + 1); return x; };
console.log('\nChance a 5-card hand contains at least one of your k key cards');
console.log('  deck size   k=1   k=2   k=3   k=4');
for (const n of [8, 10, 12, 15, 20, 25]) console.log('  ' + String(n).padStart(9) + [1, 2, 3, 4].map((k) => String(Math.round(100 * (1 - C(n - k, 5) / C(n, 5))) + '%').padStart(6)).join(''));
console.log('\nChance a 5-card hand contains BOTH halves of a two-card combo (a copies of one, b of the other)');
console.log('  deck size  1+1   2+2   3+3');
for (const n of [8, 10, 12, 15, 20, 25]) console.log('  ' + String(n).padStart(9) + [1, 2, 3].map((k) => { const none = 2 * C(n - k, 5) / C(n, 5) - C(n - 2 * k, 5) / C(n, 5); return String(Math.round(100 * (1 - none)) + '%').padStart(6); }).join(''));
