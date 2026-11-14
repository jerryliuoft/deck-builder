import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ALL_CARDS, CARDS, COLUMNS, type CardDef } from './game/cards';
import {
  CONFIG, HAZARDS, cashLeft, def, incoming, income, newGame, parFor, priceOf, reduce, sectionStart, sectionsDone,
  tonight, totalWork, workToday, type Action, type GameState,
} from './game/engine';
import { CardBack, CardFace, Chips, Tile, kindLine } from './ui/CardFace';
import { Icon } from './ui/icons';
import { Porch } from './ui/Porch';
import { Tutorial } from './ui/Tutorial';

const W = 1280;
const H = 720;
const CW = 124;
const CH = 172;
// Yard grid: 5 columns x 3 rows of landscape tiles.
const TILE_W = 182;
const TILE_H = 96;
const GRID_X = 318;
const GRID_Y = 84;
const tilePos = (col: number, row: number) => ({ x: GRID_X + col * (TILE_W + 8), y: GRID_Y + row * (TILE_H + 4) });
const DECK = { x: 322, y: 528 };
const DISCARD = { x: 1128, y: 528 };
const HAND_Y = 528;
const HAND_CX = 787;
const PLAYED_SCALE = 0.5;
const PLAYED_TOP = 390;

interface Place { x: number; y: number; scale: number; rotate: number; z: number; face: boolean; zone: string; idx: number }

function computePlaces(s: GameState): Map<number, Place> {
  const m = new Map<number, Place>();
  s.deck.forEach((id, i) => {
    const k = s.fresh.indexOf(id);
    if (k >= 0) m.set(id, { x: DECK.x + 12 + k * 16, y: DECK.y + 4 - k * 3, scale: 1, rotate: 2, z: 30 + k, face: true, zone: 'fresh', idx: k });
    else m.set(id, { x: DECK.x, y: DECK.y - Math.min(i, 14) * 0.7, scale: 1, rotate: 0, z: 10 + i, face: false, zone: 'deck', idx: i });
  });
  s.discard.forEach((id, i) => m.set(id, { x: DISCARD.x, y: DISCARD.y - Math.min(i, 14) * 0.7, scale: 1, rotate: ((id * 37) % 9) - 4, z: 10 + i, face: true, zone: 'discard', idx: i }));
  const pn = s.played.length;
  const pstep = Math.min(68, 612 / Math.max(pn - 1, 1));
  s.played.forEach((id, i) => m.set(id, { x: 326 + i * pstep - (CW * (1 - PLAYED_SCALE)) / 2, y: PLAYED_TOP - (CH * (1 - PLAYED_SCALE)) / 2, scale: PLAYED_SCALE, rotate: 0, z: 50 + i, face: true, zone: 'played', idx: i }));
  if (s.night && s.cleanup > 0) {
    const all = [...s.played, ...s.hand];
    const step = Math.min(134, 1000 / Math.max(all.length - 1, 1));
    const left = 640 - (step * (all.length - 1)) / 2 - CW / 2;
    all.forEach((id, i) => m.set(id, { x: left + i * step, y: 300, scale: 1, rotate: 0, z: 1200 + i, face: true, zone: s.played.includes(id) ? 'played' : 'hand', idx: i }));
    return m;
  }
  const hn = s.hand.length;
  const span = Math.min(132 * (hn - 1), 520);
  s.hand.forEach((id, i) => m.set(id, { x: HAND_CX - span / 2 + (hn > 1 ? (i * span) / (hn - 1) : 0) - CW / 2, y: HAND_Y, scale: 1, rotate: 0, z: 100 + i, face: true, zone: 'hand', idx: i }));
  return m;
}

function useStageScale() {
  const [k, setK] = useState(() => Math.min(window.innerWidth / W, window.innerHeight / H));
  useEffect(() => {
    const f = () => setK(Math.min(window.innerWidth / W, window.innerHeight / H));
    window.addEventListener('resize', f);
    window.addEventListener('orientationchange', f);
    window.visualViewport?.addEventListener('resize', f);
    return () => {
      window.removeEventListener('resize', f);
      window.removeEventListener('orientationchange', f);
      window.visualViewport?.removeEventListener('resize', f);
    };
  }, []);
  return k;
}

/** True when the player is using a finger: there is no hover, so a first tap inspects and a second acts. */
function useTouch() {
  const forced = useMemo(() => new URLSearchParams(window.location.search).has('touch'), []);
  const [t, setT] = useState(() => forced || window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    if (forced) return;
    const f = (e: PointerEvent) => setT(e.pointerType !== 'mouse');
    window.addEventListener('pointerdown', f, true);
    return () => window.removeEventListener('pointerdown', f, true);
  }, [forced]);
  return t;
}

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

interface Toast { key: number; text: string; kind: 'good' | 'bad' | 'info' }

export function App() {
  const k = useStageScale();
  const touch = useTouch();
  const [game, setGame] = useState<GameState | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [tutStep, setTutStep] = useState<number | null>(null);
  const seenTutorial = store.get('deckbuilder.tutorialDone') === '3';

  const start = useCallback((tutorial: boolean) => {
    setGame(newGame(tutorial ? 4242 : (Date.now() & 0x7fffffff), { tutorial }));
    setGameKey((n) => n + 1);
    setTutStep(tutorial ? 0 : null);
  }, []);
  const dispatch = useCallback((a: Action) => setGame((g) => (g ? reduce(g, a) : g)), []);
  const endTutorial = useCallback(() => { store.set('deckbuilder.tutorialDone', '3'); setTutStep(null); }, []);

  return (
    <div className={`viewport ${touch ? 'touch' : ''}`}>
      <div className="rotate">
        <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="20" width="36" height="20" rx="3" />
          <path d="M16 14a12 12 0 0 1 16 0M32 14v-5M32 14h-5" />
        </svg>
        <b>Turn your phone sideways</b>
        <span>Deck Builder is played in landscape.</span>
      </div>
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${k})` }}>
        {game ? (
          <Game key={gameKey} s={game} touch={touch} dispatch={dispatch} tutStep={tutStep} setTutStep={setTutStep}
            endTutorial={endTutorial} restart={() => start(false)} quit={() => setGame(null)} />
        ) : (
          <Title onPlay={() => start(false)} onTutorial={() => start(true)} seenTutorial={seenTutorial} />
        )}
      </div>
    </div>
  );
}

function Title({ onPlay, onTutorial, seenTutorial }: { onPlay: () => void; onTutorial: () => void; seenTutorial: boolean }) {
  const best = store.get('deckbuilder.best3');
  return (
    <div className="title">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="title-inner">
        <div className="title-porch"><Porch progress={totalWork()} /></div>
        <h1>Deck Builder</h1>
        <p className="title-tag">A deck-building game about building a deck.</p>
        <div className="title-buttons">
          {seenTutorial ? (
            <>
              <button className="btn primary big" onClick={onPlay}>Play</button>
              <button className="btn big" onClick={onTutorial}>Tutorial</button>
            </>
          ) : (
            <>
              <button className="btn primary big" onClick={onTutorial}>Learn to play</button>
              <button className="btn big" onClick={onPlay}>Skip to the game</button>
            </>
          )}
        </div>
        <p className="title-foot">{best ? `Best finish: day ${best} of ${CONFIG.maxDays}` : '14 days. 5 sections. 1 barbecue.'}</p>
      </motion.div>
    </div>
  );
}

function Num({ v }: { v: number }) {
  return (
    <motion.span key={v} className="num" initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
      {v}
    </motion.span>
  );
}

const signed = (n: number, unit = '') => `${n > 0 ? '+' : n < 0 ? '-' : ''}${unit}${Math.abs(n)}`;

function Game({ s, touch, dispatch, tutStep, setTutStep, endTutorial, restart, quit }: {
  s: GameState; touch: boolean; dispatch: (a: Action) => void; tutStep: number | null; setTutStep: (n: number) => void;
  endTutorial: () => void; restart: () => void; quit: () => void;
}) {
  const places = useMemo(() => computePlaces(s), [s]);
  const over = s.phase !== 'play';
  const cash = Math.max(0, cashLeft(s));
  const work = over ? 0 : workToday(s);
  const hz = tonight(s);
  const getsIn = incoming(s);
  const done = sectionsDone(s.progress);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<null | 'help' | 'piles' | 'guide'>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [hov, setHov] = useState<number | string | null>(null);
  const toastKey = useRef(0);
  const prevZone = useRef(new Map<number, string>());
  const cleaning = s.night && s.cleanup > 0;
  const tossing = cleaning || s.pendingToss > 0;

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const key = ++toastKey.current;
    setToasts((ts) => [...ts.slice(-2), { key, text, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.key !== key)), 3400);
  }, []);
  const nudge = useCallback((what: string, msg: string) => {
    setShake(what);
    setTimeout(() => setShake(null), 350);
    toast(msg);
  }, [toast]);

  // Turn engine events into feedback.
  useEffect(() => {
    for (const f of s.fx) {
      if (f.type === 'hazard') {
        const h = HAZARDS[f.hazard.kind];
        if (f.taken === 0) toast(`${h.name} ${f.hazard.sev} fully covered.`, 'good');
        else toast(`${h.name}: ${h.text(f.taken)}`, 'bad');
      } else if (f.type === 'section') {
        const sec = CONFIG.sections[f.index];
        if (f.index < CONFIG.sections.length - 1) toast(`${sec.name} complete. +$${CONFIG.income} every day from now on.`, 'good');
      } else if (f.type === 'install') {
        toast(`${def(s, f.id).name} installed. It works every day from now on.`, 'good');
      }
    }
    if (s.phase === 'won') {
      const best = Number(store.get('deckbuilder.best3') ?? 99);
      if (s.day < best) store.set('deckbuilder.best3', String(s.day));
    }
  }, [s.fxSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  // A card that moves out from under a resting pointer must not stay "hovered".
  useEffect(() => setHov(null), [s.fxSeq]);

  useEffect(() => {
    const m = new Map<number, string>();
    places.forEach((p, id) => m.set(id, p.zone));
    prevZone.current = m;
  });

  const blocked = modal !== null || over || tutStep === 0;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
      if (blocked || e.repeat) return;
      if (e.code === 'Space') { e.preventDefault(); dispatch({ type: 'playAll' }); }
      else if (e.key === 'Enter') { e.preventDefault(); dispatch({ type: 'endDay' }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const clickCard = (id: number, zone: string) => {
    if (touch && hov !== id) return setHov(id);
    if (tossing) {
      if (zone === 'played' && !cleaning) return;
      return dispatch({ type: 'toss', id });
    }
    if (zone === 'hand') dispatch({ type: 'play', id });
  };
  const clickPile = (i: number) => {
    const p = s.piles[i];
    if (touch && hov !== `p${i}`) return setHov(`p${i}`);
    if (s.night) return nudge(`p${i}`, 'Finish the Clean-up first.');
    if (s.pendingToss > 0) return nudge(`p${i}`, 'Finish tossing first.');
    if (p.left <= 0) return nudge(`p${i}`, 'Sold out.');
    if (priceOf(p) > cash) return nudge(`p${i}`, 'Not enough Cash.');
    dispatch({ type: 'buy', pile: i });
  };

  // Where brand-new cards fly in from.
  const origin = (id: number, p: Place): { x: number; y: number } => {
    for (const f of s.fx) {
      if (f.type === 'gain' && f.id === id) {
        if (f.from.startsWith('pile:')) {
          const pile = s.piles[Number(f.from.slice(5))];
          const t = tilePos(pile.col, pile.row);
          return { x: t.x + (TILE_W - CW) / 2, y: t.y + (TILE_H - CH) / 2 };
        }
        if (f.from === 'hazard') return { x: 90, y: 480 };
      }
    }
    return { x: p.x, y: p.y };
  };

  const newDay = s.fx.some((f) => f.type === 'newDay');
  let drawn = 0;
  const ids = [...places.keys()].sort((a, b) => a - b);
  const willFinish = s.progress + work >= totalWork();
  const par = parFor(s.day);
  const projected = s.progress + work;
  const ahead = projected >= par;
  // What tonight's hazard will actually cost, in plain numbers.
  let cost = '';
  if (getsIn > 0) {
    if (hz.kind === 'rain') cost = `-${2 * getsIn} Work tomorrow`;
    else if (hz.kind === 'inspector') cost = `-$${getsIn} Cash tomorrow`;
    else if (hz.kind === 'splinters') cost = `${getsIn} Splinter${getsIn > 1 ? 's' : ''} in your hand`;
    else if (hz.kind === 'termites') {
      const after = Math.min(totalWork(), s.progress + work);
      const loss = Math.min(3 * getsIn, after - sectionStart(sectionsDone(after)));
      cost = loss > 0 ? `-${loss} progress tonight` : '';
    }
  }
  const hint = s.night ? '' : s.hand.length > 0 ? `${s.hand.length} unplayed card${s.hand.length > 1 ? 's' : ''} will stay in your hand` : cash > 0 ? `$${cash} unspent` : '';

  // Hover inspector.
  let tip: { d: CardDef; style: React.CSSProperties } | null = null;
  if (typeof hov === 'number' && places.has(hov)) {
    const p = places.get(hov)!;
    const x = Math.max(318, Math.min(996, p.x - 70));
    tip = { d: def(s, hov), style: p.zone === 'hand' ? { left: x, bottom: H - (HAND_Y - 26) } : { left: x, top: 482 } };
  } else if (typeof hov === 'string') {
    const pile = s.piles[Number(hov.slice(1))];
    const t = tilePos(pile.col, pile.row);
    tip = { d: CARDS[pile.def], style: { left: Math.min(996, t.x), top: t.y + TILE_H + 4 } };
  }

  // Touch: the inspector carries the button that acts on the selected card or pile.
  let tipAct: { label: string; ok: boolean; run: () => void } | null = null;
  if (touch && typeof hov === 'string') {
    const i = Number(hov.slice(1));
    const p = s.piles[i];
    tipAct = { label: p.left > 0 ? `Buy for $${priceOf(p)}` : 'Sold out', ok: p.left > 0 && priceOf(p) <= cash && !s.night, run: () => clickPile(i) };
  } else if (touch && typeof hov === 'number' && places.has(hov)) {
    const id = hov;
    const z = places.get(id)!.zone;
    if (tossing && (z === 'hand' || (z === 'played' && cleaning))) tipAct = { label: 'Toss for good', ok: true, run: () => clickCard(id, z) };
    else if (!tossing && z === 'hand') tipAct = { label: 'Play', ok: true, run: () => clickCard(id, z) };
  }

  return (
    <div className="game" onClick={touch ? (e) => { if (!(e.target as HTMLElement).closest('.card,.tile,.tip')) setHov(null); } : undefined}>
      {/* ---- Top bar: the full forecast ---- */}
      <header className="bar">
        <div className="wordmark">Deck Builder</div>
        <div className="forecast">
          {s.hazards.map((h, i) => {
            const cls = i + 1 < s.day ? 'past' : i + 1 === s.day ? 'now' : '';
            return (
              <div key={i} className={`fc ${cls} ${h.kind === 'clear' ? 'safe' : 'risk'}`} title={`Night ${i + 1}: ${HAZARDS[h.kind].name}${h.sev ? ` ${h.sev}` : ''}`}>
                <span className="fc-day">{i + 1}</span>
                {i + 1 === CONFIG.maxDays ? <span className="fc-bbq">BBQ</span> : h.kind === 'clear' ? <span className="fc-dot" /> : (
                  <span className="fc-hz"><Icon id={h.kind} size={15} stroke={3} />{h.sev}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="bar-buttons">
          <button className="btn small" onClick={() => setModal('piles')}>My cards</button>
          <button className="btn small" onClick={() => setModal('guide')}>Field guide</button>
          <button className="btn small" onClick={() => setModal('help')}>Rules</button>
          <button className="btn small" onClick={quit}>Quit</button>
        </div>
      </header>

      {/* ---- Left column: the deck (porch) ---- */}
      <section className="blueprint">
        <div className="bp-head">
          <div>
            <div className="label">The Deck</div>
            <div className="bp-day">Day {s.day} of {CONFIG.maxDays}</div>
          </div>
          <div className="bp-porch"><Porch progress={s.progress} /></div>
        </div>
        <div className={`pace ${ahead ? 'ok' : 'slow'}`}>
          <div><b>{projected}</b><small>built of {totalWork()}</small></div>
          <div><b>{par}</b><small>par by tonight</small></div>
          <span className="pace-flag">{ahead ? 'On pace' : 'Behind'}</span>
        </div>
        <div className="sections">
          {CONFIG.sections.map((sec, i) => {
            const start = sectionStart(i);
            const got = Math.max(0, Math.min(sec.work, s.progress - start));
            const pend = Math.max(0, Math.min(sec.work, s.progress + work - start)) - got;
            return (
              <div key={sec.id} className={`sec ${i < done ? 'done' : i === done ? 'current' : ''}`} title={sec.learn}>
                <div className="sec-top">
                  <span className="sec-name">{sec.name}</span>
                  <span className="sec-count">{got}{pend > 0 && <em> +{pend}</em>} / {sec.work}</span>
                </div>
                <div className="sec-bar">
                  <motion.div className="sec-fill" initial={false} animate={{ width: `${(100 * got) / sec.work}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                  <motion.div className="sec-pend" initial={false} animate={{ left: `${(100 * got) / sec.work}%`, width: `${(100 * pend) / sec.work}%` }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="bp-rule">Finish a section: <b>+${CONFIG.income} every day</b> and a <b>Clean-up</b> (toss up to {CONFIG.cleanup} cards).{income(s) > 0 && <> Income now: <b>+${income(s)}</b>.</>}</div>
      </section>

      {/* ---- Tonight ---- */}
      <section className={`tonight ${getsIn > 0 ? 'danger' : ''}`}>
        <div className="label">Tonight</div>
        <div className="tonight-row">
          <div className="tonight-icon"><Icon id={hz.kind} size={38} /></div>
          <div>
            <div className="tonight-name">{HAZARDS[hz.kind].name}{hz.sev > 0 && <span className="sev">{hz.sev}</span>}</div>
            <div className="tonight-text">{hz.kind === 'clear' ? 'Nothing happens.' : `Each point: ${HAZARDS[hz.kind].each}.`}</div>
          </div>
        </div>
        {hz.kind !== 'clear' && (
          <>
            <div className={`tonight-cost ${cost ? 'bad' : 'good'}`}>
              {cost ? `You will lose: ${cost.replace(/^-/, '')}` : getsIn > 0 ? 'Nothing to lose tonight' : 'Fully covered'}
            </div>
            <div className="cover-row">
              <span className="cover-count"><Icon id="cover" size={18} /> Cover <Num v={s.cover} /></span>
              <span className="tonight-text">Cover comes from Site cards.</span>
            </div>
          </>
        )}
        {hz.kind === 'clear' && s.cover > 0 && <div className="tonight-text">Cover {s.cover} has nothing to block. It does not carry over.</div>}
      </section>

      {/* ---- The Yard: a fixed grid of piles ---- */}
      {COLUMNS.map((c, col) => (
        <div key={c.id} className={`col-head c-${c.id}`} style={{ left: tilePos(col, 0).x }} title={c.plan}>
          <b>{c.name}</b><span>{c.tip}</span>
        </div>
      ))}
      {s.piles.map((p, i) => {
        const t = tilePos(p.col, p.row);
        const d = CARDS[p.def];
        const price = priceOf(p);
        const ok = p.left > 0 && price <= cash && !s.night;
        return (
          <div key={i} className={`tile ${ok ? 'can' : 'dim'} ${hov === `p${i}` ? 'sel' : ''} ${p.left === 0 ? 'out' : ''} ${shake === `p${i}` ? 'shake' : ''}`}
            style={{ left: t.x, top: t.y }} onClick={() => clickPile(i)}
            onPointerEnter={touch ? undefined : () => setHov(`p${i}`)} onPointerLeave={touch ? undefined : () => setHov((x) => (x === `p${i}` ? null : x))}>
            <Tile d={d} price={price} left={p.left} affordable={ok} />
          </div>
        );
      })}

      {/* ---- Played area and totals ---- */}
      <div className="played-zone">
        {s.played.length === 0 && !over && <span>Play cards one at a time. Order matters.</span>}
        <div className="buffs">
          {s.buffs.map((b, i) => (
            <motion.span key={i} className="buff" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {b.kind === 'again' ? 'Next card plays twice' : `Next card x${b.mult}`}
            </motion.span>
          ))}
        </div>
      </div>
      <section className="totals">
        <div className="totals-row">
          <div className="total cash" title="Cash to spend today"><Icon id="coin" size={22} /><Num v={cash} /></div>
          <div className="total work" title="Work made today"><Icon id="work" size={22} /><Num v={work} /></div>
        </div>
        <div className="totals-row">
          <button className="btn playall" disabled={s.hand.length === 0 || tossing} onClick={() => dispatch({ type: 'playAll' })} title="Plays your hand left to right (Space)">
            Play all
          </button>
          <button className={`btn primary end ${s.hand.length === 0 && !tossing ? 'ready' : ''}`} onClick={() => dispatch({ type: 'endDay' })} title={hint}>
            <span>{cleaning ? 'Done' : willFinish ? 'Finish the deck' : 'End day'}</span>
            {cost && !willFinish && !cleaning && <small className="end-warn">{cost}</small>}
          </button>
        </div>
      </section>

      {/* ---- Installed fixtures ---- */}
      <div className="installed">
        <span className="label">Installed</span>
        {s.fixtures.length === 0 && <span className="installed-none">Nothing yet. Install cards leave your deck and work every day.</span>}
        <AnimatePresence>
          {s.fixtures.map((id) => (
            <motion.span key={id} className="fixture" title={def(s, id).text} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Icon id={def(s, id).id} size={15} stroke={3} />{def(s, id).name}
            </motion.span>
          ))}
        </AnimatePresence>
        {s.fixtures.length > 0 && hint && <span className="installed-none">{hint}</span>}
      </div>

      {/* ---- Piles ---- */}
      <div className="pile-label" style={{ left: DECK.x }} onClick={() => setModal('piles')}>Draw pile <b>{s.deck.length}</b></div>
      {s.fresh.length > 0 && !over && (
        <motion.div className="fresh-tag" style={{ left: DECK.x + 12 + (s.fresh.length - 1) * 16 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          In your hand tomorrow
        </motion.div>
      )}
      <div className="pile-label" style={{ left: DISCARD.x }} onClick={() => setModal('piles')}>Discard <b>{s.discard.length}</b></div>
      <div className="pile-slot" style={{ left: DECK.x, top: DECK.y }} />
      <div className="pile-slot" style={{ left: DISCARD.x, top: DISCARD.y }} />

      {tossing && !cleaning && (
        <motion.div className="toss-banner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {`Toss up to ${s.pendingToss} card${s.pendingToss > 1 ? 's' : ''} from your hand for good`}
          <button className="btn small" onClick={() => dispatch({ type: 'skipToss' })}>Done</button>
        </motion.div>
      )}

      {/* ---- Every card is one persistent element; its zone decides where it sits ---- */}
      <AnimatePresence>
        {ids.map((id) => {
          const p = places.get(id)!;
          const d = def(s, id);
          const was = prevZone.current.get(id);
          let delay = 0;
          if (p.zone === 'hand' && was !== 'hand') delay = (newDay ? 0.25 : 0) + drawn++ * 0.07;
          else if (p.zone === 'discard' && (was === 'hand' || was === 'played')) delay = p.idx * 0.004;
          else if (p.zone === 'deck' && was === 'discard') delay = p.idx * 0.01;
          const o = was === undefined ? origin(id, p) : p;
          const interactive = p.zone === 'hand' || p.zone === 'played';
          const canToss = tossing && (p.zone === 'hand' || (p.zone === 'played' && cleaning));
          const cls = ['card', `z-${p.zone}`, p.zone === 'hand' || canToss ? 'buyable' : '', canToss ? 'tossable' : ''].join(' ');
          const h = hov === id;
          const ty = !h ? p.y : p.zone === 'hand' ? p.y - 18 : p.y;
          const ts = !h ? p.scale : p.zone === 'hand' ? 1.06 : p.scale;
          const y = p.zone === 'played' && !cleaning ? s.yields[id] : undefined;
          return (
            <motion.div key={id} className={cls} style={{ zIndex: h ? Math.max(500, p.z + 100) : p.z, pointerEvents: interactive ? 'auto' : 'none' }}
              initial={{ x: o.x, y: o.y, scale: was === undefined && p.zone === 'fresh' ? 0.6 : p.scale, rotate: 0, opacity: 0 }}
              animate={{ x: p.x, y: ty, scale: ts, rotate: p.rotate, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.6 * p.scale, rotate: 14, transition: { duration: 0.28 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 30, delay }}
              onPointerEnter={interactive && !touch ? () => setHov(id) : undefined}
              onPointerLeave={interactive && !touch ? () => setHov((x) => (x === id ? null : x)) : undefined}
              onClick={interactive ? () => clickCard(id, p.zone) : undefined}>
              <motion.div className="flip" initial={false} animate={{ rotateY: p.face ? 0 : 180 }} transition={{ duration: 0.32, delay }}>
                <CardFace d={d} />
                <CardBack />
              </motion.div>
              {y && (
                <motion.div className="yield" initial={{ scale: 0, y: 8 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.12 }}>
                  {y.work ? <span className="y-work">{signed(y.work)}</span> : null}
                  {y.cash ? <span className="y-cash">{signed(y.cash, '$')}</span> : null}
                  {y.cover ? <span className="y-cover">{signed(y.cover)} Cover</span> : null}
                  {!y.work && !y.cash && !y.cover ? <span className="y-none">set up</span> : null}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ---- Hover inspector ---- */}
      <AnimatePresence>
        {tip && (touch || (!tossing && (tip.d.text || tip.d.learn || typeof hov === 'string'))) && (
          <motion.div key={String(hov)} className={`tip ${touch ? 'touch' : ''}`} style={touch ? { left: 14, top: 60 } : tip.style}
            initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: touch ? 0 : 0.3 } }} exit={{ opacity: 0, transition: { duration: touch ? 0 : 0.15 } }}>
            <div className="tip-head"><b>{tip.d.name}</b><span>{kindLine(tip.d)}</span></div>
            <Chips d={tip.d} />
            {tip.d.text && <p>{tip.d.text}</p>}
            {tip.d.learn && <p className="tip-learn"><i>Field note</i>{tip.d.learn}</p>}
            {!tip.d.learn && tip.d.flavor && <p className="tip-flavor">{tip.d.flavor}</p>}
            {tipAct && <button className={`btn primary tip-act ${tipAct.ok ? '' : 'dim'}`} onClick={tipAct.run}>{tipAct.label}</button>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Clean-up prompt ---- */}
      <AnimatePresence>
        {cleaning && (
          <motion.div className="cleanup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="cleanup-text">
              <h3>Clean-up</h3>
              <p><b>{CONFIG.sections[Math.max(0, done - 1)].name} is finished.</b> You now earn +${CONFIG.income} more every day.</p>
              <p>You may also remove up to <b>{s.cleanup}</b> of today's cards from your deck for good. {touch ? 'Tap a card, then tap it again to toss it.' : 'Click a card to toss it.'}
                Weak cards like Odd Job and Nails crowd out your strong ones, so a leaner deck plays its best cards more often.</p>
            </div>
            <button className="btn big cleanup-done" onClick={() => dispatch({ type: 'skipToss' })}>Keep the rest</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Night flash ---- */}
      {s.day > 1 && <motion.div key={s.day} className="night" initial={{ opacity: 0.4 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />}

      {/* ---- Toasts ---- */}
      <div className="toasts">
        <AnimatePresence>
          {toasts.map((x) => (
            <motion.div key={x.key} layout className={`toast ${x.kind}`} initial={{ opacity: 0, y: -12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              {x.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {tutStep !== null && !over && <Tutorial s={s} touch={touch} step={tutStep} setStep={setTutStep} onDone={endTutorial} />}

      <AnimatePresence>
        {modal === 'help' && <Help close={() => setModal(null)} />}
        {modal === 'guide' && <Guide close={() => setModal(null)} />}
        {modal === 'piles' && <Piles s={s} close={() => setModal(null)} />}
        {over && <EndScreen s={s} restart={restart} quit={quit} />}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, close, wide }: { children: React.ReactNode; close?: () => void; wide?: boolean }) {
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
      <motion.div className={`modal ${wide ? 'wide' : ''}`} initial={{ y: 20, scale: 0.97 }} animate={{ y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Help({ close }: { close: () => void }) {
  return (
    <Modal close={close} wide>
      <h2>Rules</h2>
      <div className="help-grid">
        <div>
          <h4>Goal</h4>
          <p>Finish all five sections of the deck ({totalWork()} Work) before the end of day {CONFIG.maxDays}.</p>
          <h4>Each day</h4>
          <ol>
            <li><b>Play</b> cards. Each one changes today's Cash, Work and Cover <i>in the order you play it</i>. Play all goes left to right.</li>
            <li><b>Spend</b> Cash: buy cards from the Yard.</li>
            <li><b>End the day.</b> Work goes into the deck. Tonight's hazard hits whatever Cover does not block.</li>
          </ol>
          <h4>The Yard</h4>
          <p>Fifteen piles that never change. Columns are colours, rows are prices: ${CONFIG.prices[0]}, ${CONFIG.prices[1]} and ${CONFIG.prices[2]}. A bought card goes on <b>top of your draw pile</b>, so you play it tomorrow.</p>
          <h4>Your cards</h4>
          <p>Played cards go to the discard pile. Cards you do not play <b>stay in your hand</b>, and you draw back up to 5.</p>
        </div>
        <div>
          <h4>Finishing a section</h4>
          <p><b>+${CONFIG.income} every day</b> for the rest of the game, and a <b>Clean-up</b>: toss up to {CONFIG.cleanup} of the cards you played today or still hold. A lean deck draws its best cards more often.</p>
          <h4>Words on cards</h4>
          <p><b>Before this / so far</b>: counts only what you already played today. Set up first, multiply last.</p>
          <p><b>Lumber</b>: the amber Framing cards marked Lumber, such as Joist and Deck Board.</p>
          <p><b>Next</b>: boosts the next card you play today.</p>
          <p><b>Install</b>: leaves your card deck for good and keeps working every day.</p>
          <p><b>Toss</b>: remove a card from your deck for good.</p>
          <p><b>Cover</b>: blocks tonight's hazard, point for point. It comes from Site cards and does not carry over.</p>
          <h4>Keys</h4>
          <p><kbd>Space</kbd> play all &nbsp; <kbd>Enter</kbd> end day</p>
        </div>
      </div>
      <button className="btn primary" onClick={close}>Back to work</button>
    </Modal>
  );
}

const GENRE: [string, string][] = [
  ['Engine', 'A set of cards that feed each other, so the whole is worth far more than the parts.'],
  ['Enabler, scaler, payoff', 'The cheap card that starts a plan, the card that makes it grow, and the card that cashes it in. The three Yard rows.'],
  ['Thinning (trashing)', 'Removing weak cards so the strong ones come around more often. Here: Toss and Clean-up.'],
  ['Cantrip', 'A card that draws a card to replace itself, like Helpful Neighbor.'],
  ['Tempo', 'How fast your deck improves against the clock. 14 days is not long.'],
  ['Greening', 'The moment you stop improving the deck and start scoring.'],
  ['Junk', 'Dead cards that clog your hand, like Splinters.'],
];

function Guide({ close }: { close: () => void }) {
  const terms = ALL_CARDS.filter((d) => d.learn);
  return (
    <Modal close={close} wide>
      <h2>Field guide</h2>
      <div className="help-grid guide">
        <div>
          <h4>The five colours</h4>
          {COLUMNS.map((c) => <p key={c.id}><span className={`dot c-${c.id}`} /> <b>{c.name}</b> ({c.engine}): {c.plan}</p>)}
          <p className="muted">One colour is a solid deck. Two that feed each other is a great one: Crew finds your pieces, Power Tools doubles them, Business pays for them.</p>
          <h4>Building a deck (the card kind)</h4>
          {GENRE.map(([k, v]) => <p key={k}><b>{k}</b>: {v}</p>)}
        </div>
        <div>
          <h4>Building a deck (the wooden kind)</h4>
          {CONFIG.sections.map((x) => <p key={x.id}><b>{x.name}</b>: {x.learn}</p>)}
          {terms.map((d) => <p key={d.id}><b>{d.name}</b>: {d.learn}</p>)}
          <p className="muted">Real codes vary by place. Check yours before you build the wooden kind.</p>
        </div>
      </div>
      <button className="btn primary" onClick={close}>Close</button>
    </Modal>
  );
}

function Piles({ s, close }: { s: GameState; close: () => void }) {
  const tally = (ids: number[]) => {
    const m = new Map<string, number>();
    for (const id of ids) m.set(s.cards[id], (m.get(s.cards[id]) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => (CARDS[b[0]].row ?? 0) - (CARDS[a[0]].row ?? 0) || a[0].localeCompare(b[0]));
  };
  const col = (title: string, ids: number[]) => (
    <div>
      <h4>{title} ({ids.length})</h4>
      {ids.length === 0 && <p className="muted">Empty</p>}
      <ul className="pile-list">
        {tally(ids).map(([k, n]) => (
          <li key={k}><span className={`dot c-${CARDS[k].color}`} />{CARDS[k].name}<b>{n > 1 ? `x${n}` : ''}</b></li>
        ))}
      </ul>
    </div>
  );
  return (
    <Modal close={close} wide>
      <h2>My cards</h2>
      <div className="help-grid three">
        {col('Draw pile', s.deck)}
        {col('In hand and played', [...s.hand, ...s.played])}
        {col('Discard pile', s.discard)}
      </div>
      <button className="btn primary" onClick={close}>Close</button>
    </Modal>
  );
}

function EndScreen({ s, restart, quit }: { s: GameState; restart: () => void; quit: () => void }) {
  const won = s.phase === 'won';
  const spare = CONFIG.maxDays - s.day;
  const grade = spare >= 2 ? 'Master Builder' : spare === 1 ? 'Journeyman' : 'Just in Time';
  const pct = Math.floor((100 * s.progress) / totalWork());
  return (
    <Modal>
      <div className="end-porch"><Porch progress={s.progress} /></div>
      <h2>{won ? 'The deck is done.' : 'The guests are standing in the yard.'}</h2>
      {won ? (
        <p>Finished on day {s.day}{spare > 0 ? ` with ${spare} day${spare > 1 ? 's' : ''} to spare` : ', as the first car pulled up'}. Grade: <b>{grade}</b>.</p>
      ) : (
        <p>The deck was {pct}% built when the barbecue started. {sectionsDone(s.progress)} of {CONFIG.sections.length} sections complete.</p>
      )}
      <p className="muted">Best day: {s.stats.best} Work · {s.stats.bought.length} cards bought · {s.stats.tossed} tossed · {s.stats.blocked} hazard points blocked, {s.stats.taken} taken</p>
      <div className="title-buttons">
        <button className="btn primary" onClick={restart}>Build another</button>
        <button className="btn" onClick={quit}>Main menu</button>
      </div>
    </Modal>
  );
}
