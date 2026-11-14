// Card definitions. Pure data plus small calc functions; no UI imports.
//
// Every card belongs to a colour. Four colours are engines (a plan you can build toward),
// one is support. `row` is its price row in the Yard: 1 enabler, 2 scaler, 3 payoff.
// `learn` is a real deck-construction fact. `flavor` is the joke.
//
// Real-cards rule: no effect may search or count the draw pile.

export type Color = 'framing' | 'tools' | 'crew' | 'business' | 'site' | 'starter';
export type Tag = 'lumber' | 'crew' | 'fixture' | 'junk';
export type HazardKind = 'clear' | 'rain' | 'inspector' | 'splinters' | 'termites';

export interface Yield { work?: number; cash?: number; cover?: number }

/** What a card can see at the moment it is played. Order matters. */
export interface TurnView {
  /** Cards played earlier today, in order. */
  before: CardDef[];
  /** Today's totals so far (never below zero; cash is what is left to spend). */
  work: number;
  cash: number;
  cover: number;
  /** Work the previous card played today gave (0 if none). */
  last: number;
  /** Work the previous two cards played today gave, added together. */
  lastTwo: number;
  /** Cards still in hand after this one left it. */
  handLeft: number;
  /** How many cards with this tag were played earlier today (a Beam counts as three Lumber). */
  n: (tag: Tag) => number;
}

export type Special =
  | { kind: 'toss'; n: number }
  | { kind: 'selfToss' }
  | { kind: 'tomorrow'; draw?: number; work?: number; cash?: number }
  | { kind: 'fetchDiscard' }
  /** The next card played today has its yield multiplied. */
  | { kind: 'next'; mult: number }
  /** The next card played today is played twice. */
  | { kind: 'again' };

export interface CardDef {
  id: string;
  name: string;
  color: Color;
  /** Yard price row (1-3). Starters and junk have none. */
  row?: 1 | 2 | 3;
  tags: Tag[];
  /** How many times this card counts toward its tags (Beam = 3). */
  weight?: number;
  cash?: number;
  work?: number;
  cover?: number;
  draw?: number;
  /** Rules text beyond the base yield chips. */
  text?: string;
  flavor?: string;
  learn?: string;
  calc?: (t: TurnView) => Yield;
  specials?: Special[];
  /** Install: when played it leaves the card deck for good and keeps working. */
  install?: {
    daily?: Yield & { draw?: number };
    aura?: { tag: Tag; work: number };
    /** The first card you play each day is played twice. */
    again?: boolean;
    /** At the end of each day, unspent Cash becomes Work. */
    savings?: boolean;
  };
  /** Auto-play hint: lower plays earlier. Used by the sim bots. */
  order?: number;
}

export const COLUMNS: { id: Color; name: string; engine: string; tip: string; plan: string }[] = [
  { id: 'framing', name: 'Framing', engine: 'Stack', tip: 'play lots', plan: 'Play lots of Lumber cards (marked on the card). Each one makes the next bigger.' },
  { id: 'tools', name: 'Power Tools', engine: 'Multiply', tip: 'play last', plan: 'Play these last. They multiply the Work you already made today.' },
  { id: 'crew', name: 'Crew', engine: 'Draw', tip: 'play first', plan: 'Play these first. Draw your whole deck and get paid for every card.' },
  { id: 'business', name: 'Business', engine: 'Money', tip: 'buy early', plan: 'Buy a couple early. Grow your income, then turn Cash into Work.' },
  { id: 'site', name: 'Site', engine: 'Support', tip: 'as needed', plan: 'Thin your deck, block hazards, fetch cards.' },
];

const defs: CardDef[] = [
  // ---- Starting deck & junk -------------------------------------------------
  { id: 'odd_job', name: 'Odd Job', color: 'starter', tags: [], cash: 1, flavor: 'Mow a lawn. Walk a dog.', order: 3 },
  {
    id: 'nails', name: 'Nails', color: 'starter', tags: [], work: 1, order: 3,
    learn: 'Nails pop as wood swells and shrinks. That is why decks are screwed down now.',
  },
  {
    id: 'splinter', name: 'Splinter', color: 'starter', tags: ['junk'], order: 2,
    text: 'Does nothing. Play it to pull it out for good.', specials: [{ kind: 'selfToss' }], flavor: 'Ow.',
    learn: 'A bullnose (rounded) edge on a board splinters far less.',
  },

  // ---- Framing (amber): Stack ----------------------------------------------
  {
    id: 'joist', name: 'Joist', color: 'framing', row: 1, tags: ['lumber'], work: 2, order: 3,
    text: '+2 Work for each Lumber card played before this.',
    calc: (t) => ({ work: 2 * t.n('lumber') }),
    learn: 'Install joists crown up, usually 16 inches on center. Load flattens the bow.',
  },
  {
    id: 'deck_board', name: 'Deck Board', color: 'framing', row: 1, tags: ['lumber'], work: 2, draw: 1, order: 1.1,
    text: '+2 Work if a Lumber card was played before this.',
    calc: (t) => ({ work: t.n('lumber') > 0 ? 2 : 0 }),
    learn: 'A "2x6" really measures 1-1/2 by 5-1/2 inches. Gap boards 1/8 inch so water drains.',
  },
  {
    id: 'baluster', name: 'Baluster', color: 'framing', row: 1, tags: ['lumber'], work: 1, order: 3.1,
    text: '+3 Work for each Baluster played before this.',
    calc: (t) => ({ work: 3 * t.before.filter((d) => d.id === 'baluster').length }),
    learn: 'Spaced so a 4 inch ball cannot pass between them. A child safety rule.',
  },
  {
    id: 'joist_hanger', name: 'Joist Hanger', color: 'framing', row: 2, tags: [], order: 6,
    text: '+4 Work for each Lumber card played before this.',
    calc: (t) => ({ work: 4 * t.n('lumber') }),
    learn: 'A metal saddle that carries a joist into the ledger. Every hole gets a fastener.',
  },
  {
    id: 'blocking', name: 'Blocking', color: 'framing', row: 2, tags: ['fixture'], order: 0,
    text: 'Install. Every Lumber card you play gives +2 Work.',
    install: { aura: { tag: 'lumber', work: 2 } },
    learn: 'Short pieces between joists. They stop twisting and take the bounce out.',
  },
  {
    id: 'ledger', name: 'Ledger Board', color: 'framing', row: 2, tags: ['fixture'], order: 0,
    text: 'Install. +4 Work every day.',
    install: { daily: { work: 4 } },
    learn: 'The board bolted to the house. It carries about half the deck. Never nails alone.',
  },
  {
    id: 'beam', name: 'Beam', color: 'framing', row: 3, tags: ['lumber'], weight: 3, work: 10, order: 2.5,
    text: 'Counts as 3 Lumber cards.',
    learn: 'The heavy member that sits on the posts and carries every joist.',
  },
  {
    id: 'picture_frame', name: 'Picture Frame', color: 'framing', row: 3, tags: [], order: 7,
    text: '+5 Work for each Lumber card played before this.',
    calc: (t) => ({ work: 5 * t.n('lumber') }),
    learn: 'A border of boards around the deck that hides every cut end.',
  },

  // ---- Power Tools (red): Multiply -----------------------------------------
  // One idea for the whole colour: these go LAST. They grow with the Work already made today.
  {
    id: 'saw', name: 'Circular Saw', color: 'tools', row: 1, tags: [], work: 4, order: 8,
    text: '+3 more if you already have 6 Work today.',
    calc: (t) => ({ work: t.work >= 6 ? 3 : 0 }),
    learn: 'Seal every cut end. End grain soaks up water like a straw and rot starts there.',
  },
  {
    id: 'nail_gun', name: 'Nail Gun', color: 'tools', row: 1, tags: [], work: 2, order: 8.2,
    text: 'Also repeat the Work your last card gave.',
    calc: (t) => ({ work: t.last }),
    flavor: 'Thunk. Thunk. Thunk.',
  },
  {
    id: 'miter_saw', name: 'Miter Saw', color: 'tools', row: 2, tags: [], order: 9,
    text: 'Double your Work so far today (adds 12 at most).',
    calc: (t) => ({ work: Math.min(12, t.work) }),
    learn: 'A saw on a pivot for clean, repeatable angled cuts. Same cut, every time.',
  },
  {
    id: 'tape_measure', name: 'Tape Measure', color: 'tools', row: 2, tags: [], order: 8.5,
    text: 'Measure twice: repeat the Work your last two cards gave.',
    calc: (t) => ({ work: t.lastTwo }),
    flavor: 'Cut once.',
  },
  {
    id: 'double_decker', name: 'Double Decker', color: 'tools', row: 3, tags: [], order: 9.5,
    text: 'Double your Work so far today.',
    calc: (t) => ({ work: t.work }),
    flavor: 'Two levels. Twice the everything.',
  },

  // ---- Crew (green): Draw ---------------------------------------------------
  { id: 'neighbor', name: 'Helpful Neighbor', color: 'crew', row: 1, tags: ['crew'], work: 1, draw: 1, order: 1, flavor: 'Brought his own gloves.' },
  { id: 'apprentice', name: 'Apprentice', color: 'crew', row: 1, tags: ['crew'], cash: 1, draw: 1, order: 1, flavor: 'Fetches things.' },
  { id: 'deck_of_cards', name: 'Deck of Cards', color: 'crew', row: 1, tags: [], draw: 2, order: 1, flavor: 'Pick a card. Any two.' },
  { id: 'contractor', name: 'Contractor', color: 'crew', row: 2, tags: ['crew'], work: 2, draw: 2, order: 1.2, flavor: 'Shows up. Eventually.' },
  {
    id: 'foreman', name: 'Foreman', color: 'crew', row: 2, tags: ['crew'], work: 2, draw: 1, order: 1.5,
    text: '+2 Work for each Crew played before this.',
    calc: (t) => ({ work: 2 * t.n('crew') }),
    flavor: 'Points at things.',
  },
  {
    id: 'all_hands', name: 'All Hands on Deck', color: 'crew', row: 3, tags: [], draw: 2, order: 7.5,
    text: '+2 Work for each Crew played before this.',
    calc: (t) => ({ work: 2 * t.n('crew') }),
    flavor: 'That means you too.',
  },
  {
    id: 'deck_the_halls', name: 'Deck the Halls', color: 'crew', row: 3, tags: [], order: 8,
    text: '+1 Work for each card played before this today.',
    calc: (t) => ({ work: t.before.length }),
    flavor: 'Fa la la la la.',
  },

  // ---- Business (gold): Money -----------------------------------------------
  { id: 'side_hustle', name: 'Side Hustle', color: 'business', row: 1, tags: [], cash: 2, order: 3, flavor: 'Decks are not free.' },
  {
    id: 'deck_chair', name: 'Deck Chair', color: 'business', row: 1, tags: [], cash: 1, draw: 1, order: 1,
    flavor: 'Supervising.',
  },
  {
    id: 'line_of_credit', name: 'Line of Credit', color: 'business', row: 2, tags: ['fixture'], order: 0,
    text: 'Install. +$3 every day.',
    install: { daily: { cash: 3 } },
    flavor: 'The bank believes in decks.',
  },
  {
    id: 'pitch_deck', name: 'Pitch Deck', color: 'business', row: 2, tags: [], order: 6.5,
    text: 'Double the Cash you have right now.',
    calc: (t) => ({ cash: t.cash }),
    flavor: 'It is like a porch, but disruptive.',
  },
  {
    id: 'sub_it_out', name: 'Sub It Out', color: 'business', row: 3, tags: [], order: 7,
    text: '+2 Work for each $1 you have right now (16 at most). The Cash is not spent.',
    calc: (t) => ({ work: Math.min(16, 2 * t.cash) }),
    learn: 'Subcontracting: paying a specialist crew to do one part of the job.',
  },
  {
    id: 'general_contractor', name: 'General Contractor', color: 'business', row: 3, tags: ['fixture'], order: 0,
    text: 'Install. At the end of each day, every $1 you did not spend becomes 2 Work.',
    install: { savings: true },
    learn: 'A general contractor runs the whole job and hires each trade. You pay, they build.',
  },

  // ---- Site (slate): support -------------------------------------------------
  {
    id: 'poop_deck', name: 'Poop Deck', color: 'site', row: 1, tags: [], cash: 1, order: 0,
    text: 'Toss a card from your hand.',
    specials: [{ kind: 'toss', n: 1 }], flavor: 'Take out the trash.',
  },
  {
    id: 'clear_the_decks', name: 'Clear the Decks', color: 'site', row: 1, tags: [], order: 0,
    text: 'Toss up to 2 cards from your hand.',
    specials: [{ kind: 'toss', n: 2 }], flavor: 'Everything must go.',
  },
  {
    id: 'deck_stain', name: 'Deck Stain', color: 'site', row: 2, tags: [], work: 2, cover: 4, order: 3,
    learn: 'Stain blocks UV greying. Put it on wet treated lumber and it peels.',
  },
  {
    id: 'flashing', name: 'Flashing', color: 'site', row: 2, tags: ['fixture'], order: 0,
    text: 'Install. +2 Cover every night.',
    install: { daily: { cover: 2 } },
    learn: 'Metal or membrane over the ledger. Without it, water rots the house framing.',
  },
  {
    id: 'tape_deck', name: 'Tape Deck', color: 'site', row: 3, tags: [], order: 1,
    text: 'Rewind: take the best card from your discard pile into your hand.',
    specials: [{ kind: 'fetchDiscard' }], flavor: 'Be kind.',
  },
  {
    id: 'tool_belt', name: 'Tool Belt', color: 'site', row: 3, tags: ['fixture'], order: 0,
    text: 'Install. Hand size +1.',
    install: { daily: { draw: 1 } },
    flavor: 'Everything within reach.',
  },
];

export const CARDS: Record<string, CardDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const ALL_CARDS: CardDef[] = defs;

/** Candidate cards for one cell of the Yard grid. A game picks one per cell. */
export function candidates(color: Color, row: number): CardDef[] {
  return defs.filter((d) => d.color === color && d.row === row);
}

export const COLOR_LABEL: Record<Color, string> = {
  framing: 'Framing', tools: 'Power Tools', crew: 'Crew', business: 'Business', site: 'Site', starter: 'Starter',
};
