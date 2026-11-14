// Auto-play ordering and deck estimates, used by the sim bots. No UI imports.
import { CARDS } from './cards';
import { def, playCard, shuffle, startDay, workToday, type GameState } from './engine';

/** A sensible next card to play: setup first, adders next, multipliers last. */
export function pickNext(s: GameState): number | undefined {
  if (s.hand.length === 0) return undefined;
  const value = (id: number) => { const d = def(s, id); return (d.work ?? 0) + (d.row ?? 0) * 3 + (d.order ?? 3); };
  // A pending "next card doubles" or "plays twice" wants the biggest card available.
  if (s.buffs.length > 0) {
    const real = s.hand.filter((id) => !def(s, id).tags.includes('junk') && !def(s, id).install);
    if (real.length > 0) return [...real].sort((a, b) => value(b) - value(a))[0];
  }
  return [...s.hand].sort((a, b) => (def(s, a).order ?? 3) - (def(s, b).order ?? 3) || (def(s, a).row ?? 0) - (def(s, b).row ?? 0))[0];
}

export interface Estimate { work: number; cash: number }

/**
 * Average Work and Cash from one day of this deck, played in a sensible order.
 * `extra` adds one more copy of a card first (what would buying it do?).
 */
export function estimate(s: GameState, extra?: string, samples = 300): Estimate {
  const pool = [...s.deck, ...s.hand, ...s.played, ...s.discard];
  let cards = s.cards;
  let fixtures = s.fixtures;
  if (extra) {
    const tmp = -1;
    cards = { ...s.cards, [tmp]: extra };
    if (CARDS[extra].install) fixtures = [...fixtures, tmp];
    else pool.push(tmp);
  }
  let work = 0;
  let cash = 0;
  for (let i = 0; i < samples; i++) {
    const sc: GameState = {
      ...s, dry: true, cards, rng: 977 + i * 7919,
      fixtures: [...fixtures], deck: [], hand: [], played: [], discard: [],
      yields: {}, buffs: [], fresh: [], carry: { work: 0, cash: 0, draw: 0 }, pendingToss: 0, spent: 0, fx: [],
      stats: { bought: [], tossed: 0, blocked: 0, taken: 0, best: 0, byDay: [] },
    };
    sc.deck = shuffle(sc, [...pool]);
    startDay(sc);
    for (let guard = 0; guard < 80; guard++) {
      const id = pickNext(sc);
      if (id === undefined) break;
      playCard(sc, id);
    }
    work += workToday(sc);
    cash += Math.max(0, sc.cash);
  }
  return { work: work / samples, cash: cash / samples };
}
