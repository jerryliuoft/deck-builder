// Line-art icons, all hand-built SVG on a 48x48 grid. No emoji anywhere.
import type { ReactNode } from 'react';

const person = (extra?: ReactNode) => (
  <>
    <circle cx="24" cy="17" r="6" />
    <path d="M12 40c0-8 5-13 12-13s12 5 12 13" />
    {extra}
  </>
);
const hardHat = <path d="M16 14a8 8 0 0 1 16 0M13 14h22" />;
const bug = (x: number, y: number, k = 1) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <ellipse cx="0" cy="0" rx="5" ry="7" />
    <path d="M-5-3l-5-3M-5 1h-6M-5 4l-5 3M5-3l5-3M5 1h6M5 4l5 3M-2-7l-2-4M2-7l2-4" />
  </g>
);
const cloud = <path d="M14 24a7 7 0 0 1 1-14 9 9 0 0 1 17 2 6 6 0 0 1 1 12z" />;

const ART: Record<string, ReactNode> = {
  odd_job: (<><circle cx="24" cy="24" r="13" /><path d="M28 19c-1-2-7-3-7 1s7 3 7 7-6 3-8 1M24 14v3M24 31v3" /></>),
  nails: (<><path d="M13 12h8M17 12v24l0 3M25 10h8M29 10v22M35 18h8M39 18v20" /><path d="M17 36l-1 3M29 32l-1 3M39 38l-1 3" /></>),
  splinter: (<><path d="M8 38L30 14l10-6-6 10L12 40z" /><path d="M18 30l6-2M24 24l5-1" /></>),
  plank: (<><rect x="5" y="17" width="38" height="14" rx="2" /><path d="M10 22h12M26 26h12M14 27h6" /></>),
  side_hustle: (<><rect x="8" y="17" width="32" height="20" rx="3" /><path d="M18 17v-4h12v4M8 26h32M22 26v3h4v-3" /></>),
  deck_screws: (<><path d="M16 9h16M24 9v6M19 15h10l-1 5h-8zM20 20l8 3M20 25l8 3M20 30l7 3M21 35l3 5 3-6" /></>),
  lag_bolts: (<><path d="M24 8l13 8v16l-13 8-13-8V16z" /><circle cx="24" cy="24" r="6" /></>),
  deck_stain: (<><path d="M12 16h24v22a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" /><ellipse cx="24" cy="16" rx="12" ry="3.5" /><path d="M12 18c-5 4-5 14 0 16M28 19v8a2 2 0 0 0 4 0v-7" /></>),
  pallet: (<><path d="M6 14h36v5H6zM6 23h36v5H6zM6 32h36v5H6zM12 19v4M24 19v4M36 19v4M12 28v4M24 28v4M36 28v4" /></>),
  joist: (<><path d="M4 20h40v9H4zM10 20v-5h4v5M34 20v-5h4v5M10 29v4M38 29v4" /></>),
  post: (<><path d="M18 8h12v32H18zM18 8l4-3h12l-4 3M30 8l4-3v32l-4 3M14 40h24" /></>),
  cedar: (<><path d="M6 10h36v8H6zM6 20h36v8H6zM6 30h36v8H6zM12 14h8M28 24h9M14 34h10" /></>),
  hammer: (<><path d="M10 12h18l6 5v3H10zM19 20v20h5V20" /></>),
  saw: (<><circle cx="24" cy="24" r="12" /><circle cx="24" cy="24" r="2.5" /><path d="M24 8v-3l3 3M38 17l3-1-1 4M40 31l2 2-4 1M24 40v3l-3-3M10 31l-3 1 1-4M8 17l-2-2 4-1" /></>),
  drill: (<><path d="M6 14h22l4 3h8v6h-8l-4 3h-8v12h-9l1-12H6zM40 20h4" /></>),
  tape_measure: (<><rect x="8" y="10" width="26" height="26" rx="5" /><circle cx="21" cy="23" r="6" /><path d="M34 32h9v4H20M40 32v-3" /></>),
  wheelbarrow: (<><path d="M4 14h8l4 14h18l6-12H13" /><circle cx="24" cy="35" r="5" /><path d="M34 28l8 8" /></>),
  neighbor: person(<path d="M36 22l4-8M40 14l2 1" />),
  brother_in_law: person(<path d="M17 13h14l5 2H17M38 30v-6M38 34v.5" />),
  contractor: person(hardHat),
  foreman: person(<>{hardHat}<path d="M33 28h8v11h-8zM35 32h4M35 35h4" /></>),
  deck_of_cards: (<><rect x="9" y="12" width="18" height="26" rx="2.5" transform="rotate(-10 18 25)" /><rect x="21" y="10" width="18" height="26" rx="2.5" transform="rotate(8 30 23)" /><path d="M30 18l4 5-4 5-4-5z" transform="rotate(8 30 23)" /></>),
  flight_deck: (<><path d="M5 24l38-14-10 30-9-12z" /><path d="M24 28l19-18M24 28v9l5-5" /></>),
  pitch_deck: (<><rect x="7" y="9" width="34" height="22" rx="2" /><path d="M12 26l7-6 5 3 9-9M29 14h4v4M24 31v6M16 41l8-4 8 4" /></>),
  hit_the_deck: (<><path d="M24 6v20M16 19l8 8 8-8M6 38h36M10 32l-4-3M38 32l4-3M17 33l-2-4M31 33l2-4" /></>),
  deck_the_halls: (<><path d="M24 26C14 26 8 20 7 10c9 0 16 5 17 16zM24 26c10 0 16-6 17-16-9 0-16 5-17 16z" /><circle cx="20" cy="33" r="3.5" /><circle cx="28" cy="33" r="3.5" /><circle cx="24" cy="39" r="3.5" /></>),
  poop_deck: (<><path d="M5 28h38l-6 11H12zM24 28V7M24 8l12 6-12 6M11 28v-7h8v7" /></>),
  clear_the_decks: (<><path d="M33 6L21 26M13 28l14 4-3 11H8z" /><path d="M14 36l-1 6M19 37l-1 6" /></>),
  stacked_deck: (<><rect x="14" y="8" width="22" height="30" rx="2.5" /><path d="M11 12v29h20M8 16v29h20" /><path d="M25 16l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" /></>),
  deck_chair: (<><path d="M10 40l22-30M36 40L18 12M13 36h20M16 15c4 8 9 12 16 15" /></>),
  double_decker: (<><rect x="5" y="8" width="38" height="28" rx="3" /><path d="M5 21h38M10 12h6v5h-6zM21 12h6v5h-6zM32 12h6v5h-6zM10 25h6v5h-6zM21 25h6v5h-6zM33 25h5v11" /><circle cx="14" cy="38" r="3.5" /><circle cx="33" cy="38" r="3.5" /></>),
  on_deck: (<><path d="M8 40l3 3 26-28a4 4 0 0 0-6-6z" /><circle cx="36" cy="34" r="6" /><path d="M32 31c2 1 3 4 2 7" /></>),
  deckhand: person(<path d="M14 12h20l-2-5H16zM38 22v18M34 40h8M35 43h6" />),
  tape_deck: (<><rect x="5" y="11" width="38" height="26" rx="3" /><circle cx="16" cy="22" r="4" /><circle cx="32" cy="22" r="4" /><path d="M20 22h8M14 37l3-6h14l3 6" /></>),
  decked_out: (<><path d="M24 24L8 14v20zM24 24l16-10v20z" /><rect x="20" y="20" width="8" height="8" rx="1.5" /></>),
  many_things: (<><path d="M24 5l17 10v18L24 43 7 33V15z" /><path d="M24 14l10 16H14zM24 5v9M7 15l7 15M41 15l-7 15M24 43l-10-13M24 43l10-13" /></>),
  all_hands: (<><path d="M10 40V22M10 22l-3-8M10 22l0-10M10 22l3-9M24 40V20M24 20l-3-9M24 20V8M24 20l3-9M38 40V22M38 22l-3-9M38 22V12M38 22l3-8" /></>),
  full_deck: (<><path d="M13 7h14M35 15v24a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V7" /><path d="M27 7l8 8" strokeDasharray="2.5 3" /><path d="M20 22c0-5 8-5 8 0 0 3-4 3-4 7M24 34v.5" /></>),

  shim: (<><path d="M5 34l38-12v12zM14 31v3M24 28v6M34 25v9" /></>),
  joist_hanger: (<><path d="M10 12h8v24h12V12h8M18 18h12M14 16v.5M34 16v.5M22 30v.5M26 30v.5" /></>),
  lag_screw: (<><path d="M17 6h14l3 6-3 6H17l-3-6zM24 18v6M19 24h10l-1 4h-8zM20 28l8 3M20 32l8 3M21 36l3 6 3-6" /></>),
  beam: (<><path d="M4 16h40v6H4zM4 30h40v6H4zM20 22v8M28 22v8" /></>),
  baluster: (<><path d="M6 10h36M6 38h36M12 10v28M20 10v28M28 10v28M36 10v28" /></>),
  stringer: (<><path d="M6 40V32h9v-8h9v-8h9V8h9M6 40l36-24" /></>),
  cantilever: (<><path d="M4 18h40v7H4zM10 25v15M24 25v15M6 40h22" /><path d="M38 28v8M35 33l3 3 3-3" /></>),
  chalk_line: (<><path d="M8 30l8-14h10l6 14z" /><path d="M32 30h12" strokeDasharray="3 3" /><circle cx="21" cy="24" r="3" /></>),
  pilot_hole: (<><circle cx="24" cy="30" r="10" /><circle cx="24" cy="30" r="3" /><path d="M24 4v18M20 8l8 3M20 13l8 3" /></>),
  triangle: (<><path d="M8 40V10l32 30z" /><path d="M8 33h7v7" /></>),
  ledger: (<><path d="M4 8v32M4 18h40v10H4M12 23v.5M22 23v.5M32 23v.5M40 23v.5" /></>),
  blocking: (<><path d="M8 6v36M24 6v36M40 6v36M8 20h16v8H8M24 14h16v8H24" /></>),
  flashing: (<><path d="M8 6v14h30v10M14 30v6M22 32v8M30 34v6" /></>),
  treated: (<><rect x="6" y="18" width="36" height="14" rx="2" /><path d="M14 18v-5M14 8v.5M24 18v-7M24 6v.5M34 18v-5M34 8v.5M12 25h24" /></>),
  permit: (<><rect x="10" y="6" width="28" height="36" rx="2.5" /><path d="M16 14h16M16 20h16M16 26h8" /><path d="M24 34l4 4 8-9" /></>),
  dumpster: (<><path d="M5 16h38l-4 22H9zM3 16h42M14 16l2-6h16l2 6M16 23v9M24 23v9M32 23v9" /></>),
  tool_belt: (<><path d="M4 14h40v8H4zM20 14v8M28 14v8M9 22v14h10V22M30 22v10h9V22M34 32v8" /></>),
  inspector: (<><rect x="11" y="9" width="26" height="33" rx="2.5" /><path d="M19 9V6h10v3M17 19h14M17 26h14M17 33h8" /></>),
  cover: (<><path d="M24 5l16 6v12c0 10-7 17-16 20-9-3-16-10-16-20V11z" /></>),

  deck_board: (<><rect x="4" y="12" width="40" height="10" rx="1.5" /><rect x="4" y="26" width="40" height="10" rx="1.5" /><path d="M10 17v.5M38 17v.5M10 31v.5M38 31v.5M18 17h10M22 31h10" /></>),
  picture_frame: (<><rect x="6" y="8" width="36" height="32" rx="1.5" /><rect x="13" y="15" width="22" height="18" /><path d="M6 8l7 7M42 8l-7 7M6 40l7-7M42 40l-7-7" /></>),
  nail_gun: (<><path d="M6 12h26l4 4v6H18l-2 6h-6l2-6H6zM16 28l-3 12h8l2-10M36 19h8M40 15v8" /></>),
  table_saw: (<><path d="M4 26h40M8 26v14M40 26v14" /><path d="M14 26a10 10 0 0 1 20 0" /><path d="M24 12v-3M31 15l2-2M17 15l-2-2" /></>),
  apprentice: (<><circle cx="24" cy="17" r="6" /><path d="M12 40c0-8 5-13 12-13s12 5 12 13" /><path d="M16 12h16M19 12l1-5h8l1 5" /></>),
  line_of_credit: (<><rect x="5" y="12" width="38" height="24" rx="3" /><path d="M5 19h38M11 29h8M30 29h7" /></>),
  sub_it_out: (<><circle cx="15" cy="16" r="5" /><path d="M6 36c0-6 4-10 9-10s9 4 9 10" /><path d="M28 20h14M36 14l6 6-6 6" /></>),
  general_contractor: (<><circle cx="24" cy="17" r="6" /><path d="M12 40c0-8 5-13 12-13s12 5 12 13" /><path d="M16 14a8 8 0 0 1 16 0M13 14h22M24 6v4" /><path d="M21 33h6M24 30v6" /></>),

  // Hazards and UI
  clear: (<><path d="M32 30A14 14 0 0 1 20 9a14 14 0 1 0 12 21z" /><path d="M34 10v4M32 12h4M40 20v3M38.500 21.500h3" /></>),
  rain: (<>{cloud}<path d="M16 30l-2 6M24 30l-2 6M32 30l-2 6" /></>),
  downpour: (<>{cloud}<path d="M13 29l-3 9M19 29l-3 9M25 29l-3 9M31 29l-3 9M37 29l-3 9" /></>),
  hoa: (<><rect x="11" y="9" width="26" height="33" rx="2.500" /><path d="M19 9V6h10v3M17 19h14M17 26h14M17 33h8" /></>),
  splinters: (<><path d="M8 38L30 14l10-6-6 10L12 40z" /><path d="M30 34l8 6M36 30l5 2" /></>),
  termites: bug(24, 25, 1.5),
  swarm: (<>{bug(14, 16, 0.85)}{bug(33, 18, 0.85)}{bug(23, 35, 0.85)}</>),
  tarp: (<><path d="M4 36L24 10l20 26zM24 10v26M4 36l-1 5M44 36l1 5" /></>),
  coin: (<><circle cx="24" cy="24" r="15" /><path d="M29 18c-1-3-9-3-9 2s9 3 9 8-8 4-10 1M24 12v4M24 33v4" /></>),
  work: (<><path d="M7 11h22l8 6v5H7zM18 22v22h7V22" /></>),
  draw: (<><rect x="13" y="7" width="22" height="32" rx="3" /><path d="M24 17v12M18 23h12" /></>),
};

export function Icon({ id, size = 24, stroke = 2.2 }: { id: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ART[id] ?? <rect x="10" y="10" width="28" height="28" rx="4" />}
    </svg>
  );
}
