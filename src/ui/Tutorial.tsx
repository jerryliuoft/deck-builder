import { useEffect } from 'react';
import type React from 'react';
import { motion } from 'motion/react';
import { def, type GameState } from '../game/engine';

interface Step {
  title: string;
  body: string;
  /** Wording for touch screens, where there is no hover and no keyboard. */
  bodyTouch?: string;
  /** Spotlight rectangle in stage coordinates. Omitted = centered dialog. */
  rect?: { x: number; y: number; w: number; h: number };
  /** Where the text bubble sits. */
  at?: { x: number; y: number };
  /** Advance automatically once the player has done the thing. */
  auto?: (s: GameState) => boolean;
  button?: string;
}

export const STEPS: Step[] = [
  {
    title: 'Build a deck. With a deck.',
    body: 'The barbecue is in 14 days and there is no deck to hold it on. Build all five sections before the guests arrive. Your tools: a small deck of cards that you will turn into an engine.',
    button: 'Show me',
  },
  {
    title: 'Your hand',
    body: 'Odd Jobs make Cash. Nails make Work. Click a card to play it. Later, cards will care about the order you play them in: set up first, big numbers last. For now, click Play all (or press Space).',
    bodyTouch: 'Odd Jobs make Cash. Nails make Work. Tap a card to read it, then tap it again to play it. Later, cards will care about the order you play them in: set up first, big numbers last. For now, tap Play all.',
    rect: { x: 452, y: 500, w: 670, h: 212 },
    at: { x: 620, y: 290 },
    auto: (s) => s.hand.length === 0,
  },
  {
    title: 'Cash and Work',
    body: 'Each played card shows what it added. Cash is spent today or lost. Work is hammered into the deck when the day ends.',
    rect: { x: 1012, y: 382, w: 250, h: 98 },
    at: { x: 664, y: 210 },
    button: 'Got it',
  },
  {
    title: 'The Yard',
    body: 'Fifteen piles, and they never change, so you can plan the whole build. Each column is a colour with its own plan. Each row is a price: $3 starts a plan, $5 grows it, $8 cashes it in. Hover a pile to read it. Now buy any $3 card.',
    bodyTouch: 'Fifteen piles, and they never change, so you can plan the whole build. Each column is a colour with its own plan. Each row is a price: $3 starts a plan, $5 grows it, $8 cashes it in. Tap a pile to read it, then tap it again to buy it. Now buy any $3 card.',
    rect: { x: 312, y: 58, w: 954, h: 326 },
    at: { x: 470, y: 500 },
    auto: (s) => s.stats.bought.length > 0,
  },
  {
    title: 'It is on top of your draw pile',
    body: 'Look at your draw pile: the card you bought is lying face up on top of it. You will draw it tomorrow, so every purchase pays off the very next day. End the day (or press Enter).',
    rect: { x: 1112, y: 428, w: 146, h: 48 },
    at: { x: 760, y: 220 },
    auto: (s) => s.day >= 2,
  },
  {
    title: 'Are you on pace?',
    body: 'Par is how much a build on track has finished by tonight. Early on you will be behind, and that is fine. Finishing a section pays twice: +$2 every day from then on, and a Clean-up, where you toss up to 2 weak cards for good.',
    rect: { x: 14, y: 60, w: 292, h: 428 },
    at: { x: 322, y: 180 },
    button: 'Next',
  },
  {
    title: 'Tonight: Termites',
    body: 'Most nights something goes wrong, and this panel says exactly what it will cost you. You cannot buy your way out. Plan around it: finish a section before Termites arrive, or pick up a Site card that gives Cover, which blocks a hazard point for point.',
    rect: { x: 14, y: 490, w: 292, h: 220 },
    at: { x: 322, y: 380 },
    button: 'Next',
  },
  {
    title: 'No surprises',
    body: 'The top bar shows every night of the whole build. Nothing in this game is hidden except the order of your own draw pile.',
    rect: { x: 404, y: 2, w: 482, h: 48 },
    at: { x: 480, y: 64 },
    button: 'Next',
  },
  {
    title: 'Pick a plan, then mix',
    body: 'Buying down one column is a complete plan. The strongest decks mix two: Crew draws your pieces, Power Tools doubles them, Business pays for them. A good opening is one or two Business cards, so you can afford the $5 and $8 rows.',
    rect: { x: 312, y: 58, w: 954, h: 326 },
    at: { x: 470, y: 500 },
    button: 'Next',
  },
  {
    title: 'That is the whole game',
    body: 'Play in a smart order, climb the columns, keep the deck lean. Cards you do not play stay in your hand, so you can hold one for a better day. The Field guide in the top bar explains every term. Good luck.',
    button: 'Start building',
  },
];

const BW = 600;
/** Touch screens get a larger bubble, placed beside the spotlight instead of at a hand-tuned spot. */
function touchPlace(r?: Step['rect']): React.CSSProperties {
  if (!r) return { left: 340, top: 150, width: BW };
  if (r.w < 400 && r.x < 100) {
    const left = r.x + r.w + 14;
    return r.y < 300 ? { left, top: r.y, width: BW } : { left, bottom: 720 - (r.y + r.h), width: BW };
  }
  const left = Math.max(12, Math.min(1280 - BW - 12, r.x + r.w / 2 - BW / 2));
  return r.y + r.h / 2 > 360 ? { left, bottom: 720 - r.y + 14, width: BW } : { left, top: r.y + r.h + 14, width: BW };
}

export function Tutorial({ s, touch, step, setStep, onDone }: { s: GameState; touch: boolean; step: number; setStep: (n: number) => void; onDone: () => void }) {
  const st = STEPS[step];
  const next = () => (step + 1 >= STEPS.length ? onDone() : setStep(step + 1));
  const satisfied = !!st?.auto && st.auto(s);
  useEffect(() => {
    if (satisfied) {
      const t = setTimeout(next, 450);
      return () => clearTimeout(t);
    }
  });
  if (!st) return null;
  const centered = !st.rect;
  return (
    <div className={`tut ${centered ? 'tut-modal' : ''}`}>
      {st.rect && (
        <motion.div className="tut-spot" initial={false}
          animate={{ x: st.rect.x, y: st.rect.y, width: st.rect.w, height: st.rect.h }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }} />
      )}
      <motion.div key={step} className="tut-bubble"
        style={touch ? touchPlace(st.rect) : centered ? { left: 440, top: 230, width: 400 } : { left: st.at!.x, top: st.at!.y }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="tut-step">{step + 1} / {STEPS.length}</div>
        <h3>{st.title}</h3>
        <p>{touch ? (st.bodyTouch ?? st.body.replace(' (or press Enter)', '')) : st.body}</p>
        <div className="tut-actions">
          {st.button && <button className="btn primary" onClick={next}>{st.button}</button>}
          {!st.button && <span className="tut-wait">Waiting for you…</span>}
          {step < STEPS.length - 1 && <button className="btn link" onClick={onDone}>Skip tutorial</button>}
        </div>
      </motion.div>
    </div>
  );
}
